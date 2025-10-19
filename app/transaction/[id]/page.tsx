import TransactionDetailPage from "./TransactionDetailPage";

export default async function Page ({params}: any) {
    const {id} = await params
    return (
        <TransactionDetailPage transactionId={id} />
    )
}