"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  RefreshCcw,
  Search,
  X,
  AlertTriangle,
  Loader2,
  Send,
  Users,
  CheckSquare,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  Clock,
  FileText,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { User } from "@/types/type";
import { EmailTemplate } from "@/types/admin";
import useAdminUsers from "@/hooks/admin/useAdminUsers";
import useAdminBulkEmail from "@/hooks/admin/useAdminBulkEmail";

export default function AdminBulkMailerPage() {
  const {
    fetchUsers,
    users,
    loading: usersLoading,
    error: usersError,
    clearError: clearUsersError
  } = useAdminUsers();

  const {
    fetchEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    sendBulkEmail,
    fetchEmailHistory,
    emailTemplates,
    emailHistory,
    loading: emailLoading,
    error: emailError,
    clearError: clearEmailError
  } = useAdminBulkEmail();

  // Compose Email State
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState("");

  // User Selection State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("compose");

  // Template Dialog State
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    body: "",
    type: "custom" as EmailTemplate['type']
  });

  // History Dialog State
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchUsers({ limit: 100 }),
        fetchEmailTemplates(),
        fetchEmailHistory({ limit: 20 })
      ]);
    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Failed to load data");
    }
  };

  const handleRefresh = () => {
    clearUsersError();
    clearEmailError();
    loadData();
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (statusFilter !== "all" && user.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleSelectAllUsers = () => {
    setSendToAll(true);
    setSelectedUsers([]);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setSelectedTemplate(templateId);
    }
  };

  const handleSendEmail = async () => {
    if (!subject || !body) {
      toast.error("Please fill in subject and body");
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      toast.error("Please select recipients");
      return;
    }

    try {
      const result = await sendBulkEmail({
        subject,
        body,
        recipients: sendToAll ? ['all'] : selectedUsers,
        templateId: selectedTemplate || undefined,
        scheduledAt: scheduledDate || undefined
      });

      if (result.success) {
        toast.success(`Email ${scheduledDate ? 'scheduled' : 'sent'} to ${result.data?.recipientCount || 0} users`);
        // Reset form
        setSubject("");
        setBody("");
        setSelectedUsers([]);
        setSendToAll(false);
        setSelectedTemplate("");
        setScheduledDate("");
        // Refresh history
        fetchEmailHistory({ limit: 20 });
      } else {
        toast.error(result.error || "Failed to send email");
      }
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error("Failed to send email");
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.body) {
      toast.error("Please fill in all template fields");
      return;
    }

    try {
      const result = await createEmailTemplate({
        name: templateForm.name,
        subject: templateForm.subject,
        body: templateForm.body,
        type: templateForm.type,
        variables: [],
        isActive: true
      });

      if (result.success) {
        toast.success("Template created successfully");
        setTemplateDialogOpen(false);
        setTemplateForm({ name: "", subject: "", body: "", type: "custom" });
      } else {
        toast.error(result.error || "Failed to create template");
      }
    } catch (err) {
      console.error("Error creating template:", err);
      toast.error("Failed to create template");
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const result = await updateEmailTemplate(editingTemplate.id, {
        name: templateForm.name,
        subject: templateForm.subject,
        body: templateForm.body,
        type: templateForm.type
      });

      if (result.success) {
        toast.success("Template updated successfully");
        setTemplateDialogOpen(false);
        setEditingTemplate(null);
        setTemplateForm({ name: "", subject: "", body: "", type: "custom" });
      } else {
        toast.error(result.error || "Failed to update template");
      }
    } catch (err) {
      console.error("Error updating template:", err);
      toast.error("Failed to update template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const result = await deleteEmailTemplate(templateId);
      if (result.success) {
        toast.success("Template deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete template");
      }
    } catch (err) {
      console.error("Error deleting template:", err);
      toast.error("Failed to delete template");
    }
  };

  const openTemplateDialog = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        name: template.name,
        subject: template.subject,
        body: template.body,
        type: template.type
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({ name: "", subject: "", body: "", type: "custom" });
    }
    setTemplateDialogOpen(true);
  };

  // Loading state
  if (usersLoading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Bulk Mailer</h1>
            <p className="text-white/70 mt-1">Send emails to users on Adams Pay</p>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
            <p className="text-lg font-medium text-white">Loading Bulk Mailer</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Bulk Mailer</h1>
          <p className="text-white/70 mt-1">Send emails to users on Adams Pay</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={usersLoading || emailLoading} 
          variant="outline"
          className="border-white/20 bg-transparent text-white hover:bg-white/10"
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${(usersLoading || emailLoading) ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error states */}
      {(usersError || emailError) && (
        <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20 p-0">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h3 className="font-medium text-white">Error</h3>
                <p className="text-sm text-white/70">{usersError || emailError}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRefresh}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/10 border-white/20">
          <TabsTrigger value="compose" className="data-[state=active]:bg-[#70b340] data-[state=active]:text-white">
            <Mail className="h-4 w-4 mr-2" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-[#70b340] data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-[#70b340] data-[state=active]:text-white">
            <Clock className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Compose Form */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Compose Email</CardTitle>
                  <CardDescription className="text-white/70">
                    Create and send emails to selected users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Selector */}
                  <div className="space-y-2">
                    <Label className="text-white/90">Use Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                        {emailTemplates.filter(t => t.isActive).map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label className="text-white/90">Subject *</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email subject..."
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <Label className="text-white/90">Message *</Label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Email message..."
                      rows={10}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSendEmail}
                    disabled={emailLoading || !subject || !body || (!sendToAll && selectedUsers.length === 0)}
                    className="w-full bg-[#70b340] hover:bg-[#5a9235]"
                  >
                    {emailLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {scheduledDate ? 'Schedule Email' : 'Send Email'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* User Selector */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Recipients</CardTitle>
                <CardDescription className="text-white/70">
                  {sendToAll ? 'All users' : `${selectedUsers.length} selected`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Send to All */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendToAll"
                    checked={sendToAll}
                    onCheckedChange={(checked) => {
                      setSendToAll(!!checked);
                      if (checked) setSelectedUsers([]);
                    }}
                  />
                  <Label htmlFor="sendToAll" className="text-white/90 cursor-pointer">
                    Send to all users
                  </Label>
                </div>

                {!sendToAll && (
                  <>
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="user">Users</SelectItem>
                          <SelectItem value="admin">Admins</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Select All */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                    </Button>

                    {/* User List */}
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {filteredUsers.map(user => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-2  rounded-lg hover:bg-white/5 ${
                              selectedUsers.includes(user.id) ? 'bg-[#70b340]/20' : ''
                            }`}
                          >
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => handleSelectUser(user.id)}
                            />
                            <Avatar className="h-8 w-8 border-2 border-white/20">
                              <AvatarImage src={user.profilePicture} />
                              <AvatarFallback className="bg-gradient-to-br from-[#70b340] to-[#5a9235] text-white text-xs">
                                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{user.name}</p>
                              <p className="text-xs text-white/50 truncate">{user.email}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {user.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 ">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Email Templates</CardTitle>
                  <CardDescription className="text-white/70">
                    Manage reusable email templates
                  </CardDescription>
                </div>
                <Button
                  onClick={() => openTemplateDialog()}
                  className="bg-[#70b340] hover:bg-[#5a9235]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {emailTemplates.length === 0 ? (
                <div className="text-center py-12 text-white/70">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No templates yet. Create your first template!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emailTemplates.map(template => (
                    <Card key={template.id} className="bg-white/5 border-white/10 p-0">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-white font-semibold">{template.name}</h4>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {template.type}
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openTemplateDialog(template)}
                                className="text-white hover:bg-white/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-white/70 mb-1">Subject:</p>
                            <p className="text-sm text-white">{template.subject}</p>
                          </div>
                          <div>
                            <p className="text-sm text-white/70 mb-1">Preview:</p>
                            <p className="text-sm text-white/80 line-clamp-2">{template.body}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 ">
            <CardHeader>
              <CardTitle className="text-white">Email History</CardTitle>
              <CardDescription className="text-white/70">
                View sent and scheduled emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailHistory.length === 0 ? (
                <div className="text-center py-12 text-white/70">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No email history yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white/90">Subject</TableHead>
                        <TableHead className="text-white/90">Recipients</TableHead>
                        <TableHead className="text-white/90">Status</TableHead>
                        <TableHead className="text-white/90">Sent By</TableHead>
                        <TableHead className="text-white/90">Date</TableHead>
                        <TableHead className="text-right text-white/90">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailHistory.map(history => (
                        <TableRow key={history.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="text-white">{history.subject}</TableCell>
                          <TableCell className="text-white/80">{history.recipientCount} users</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                history.status === 'sent'
                                  ? 'bg-green-100 text-green-800'
                                  : history.status === 'scheduled'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {history.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white/80">{history.sentBy}</TableCell>
                          <TableCell className="text-white/80">
                            {history.sentAt
                              ? new Date(history.sentAt).toLocaleDateString()
                              : history.scheduledAt
                              ? `Scheduled: ${new Date(history.scheduledAt).toLocaleDateString()}`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedHistory(history);
                                setHistoryDialogOpen(true);
                              }}
                              className="text-white hover:bg-white/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription className="text-white/70">
              {editingTemplate ? 'Update template details' : 'Create a reusable email template'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/90">Template Name *</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Welcome Email"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/90">Type</Label>
              <Select
                value={templateForm.type}
                onValueChange={(value: EmailTemplate['type']) =>
                  setTemplateForm(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white/90">Subject *</Label>
              <Input
                value={templateForm.subject}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Welcome to Adams Pay!"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/90">Body *</Label>
              <Textarea
                value={templateForm.body}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Email body..."
                rows={8}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTemplateDialogOpen(false)}
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
              disabled={emailLoading}
              className="bg-[#70b340] hover:bg-[#5a9235]"
            >
              {emailLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingTemplate ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Detail Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
          </DialogHeader>

          {selectedHistory && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/50">Subject</p>
                  <p className="text-white">{selectedHistory.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Recipients</p>
                  <p className="text-white">{selectedHistory.recipientCount} users</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Sent By</p>
                  <p className="text-white">{selectedHistory.sentBy}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Status</p>
                  <Badge
                    className={
                      selectedHistory.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : selectedHistory.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {selectedHistory.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-white/50 mb-2">Message</p>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white whitespace-pre-wrap">{selectedHistory.body}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setHistoryDialogOpen(false)}
              className="bg-white/10 hover:bg-white/20"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}