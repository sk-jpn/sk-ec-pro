import { NoData, PageHeader } from "../admin-ui";
export default function OrdersPage() { return <><PageHeader title="注文管理" description="注文確定後の購入状況を管理します。" /><NoData title="注文データはありません" description="データベース接続後、注文確定した案件がここに表示されます。" /></>; }
