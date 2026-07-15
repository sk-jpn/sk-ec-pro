import { MoreHorizontal, Search, UserPlus } from "lucide-react";
import { customers } from "../data";
import { PageHeader } from "../admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function CustomersPage() { return <><PageHeader title="顧客管理" description="顧客情報と見積依頼の履歴を確認します。" action={<Button><UserPlus size={16} />顧客を追加</Button>} /><Card><CardContent className="p-0"><div className="border-b border-slate-200 p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><Input className="pl-9" placeholder="顧客名・メールで検索" /></div></div><Table><TableHeader><TableRow><TableHead>顧客名</TableHead><TableHead>会社名</TableHead><TableHead>メール</TableHead><TableHead>登録日</TableHead><TableHead>見積件数</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{customers.map((customer) => <TableRow key={customer.email}><TableCell className="font-medium">{customer.name}</TableCell><TableCell>{customer.company}</TableCell><TableCell className="text-slate-500">{customer.email}</TableCell><TableCell>{customer.joined}</TableCell><TableCell><Badge variant="secondary">{customer.estimates}件</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal size={17} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem>顧客詳細</DropdownMenuItem><DropdownMenuItem>見積履歴</DropdownMenuItem><DropdownMenuItem>編集</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></>; }
