'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, Target, CreditCard, 
  BrainCircuit, FileText, Settings, Plus, Trash2, Edit2, AlertTriangle,
  Download, PieChart as PieChartIcon, MoreHorizontal, Link as LinkIcon, Copy, ExternalLink
} from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import type { Transaction, Account, Budget, Debt, SavingsGoal, RecurringTransaction } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useHover } from '@/components/layout/hover-context';
import { useLevel } from '@/hooks/use-level';
import { Lock } from 'lucide-react';

export default function BudgetingPage() {
  const { 
    accounts, setAccounts, 
    transactions, setTransactions,
    budgets, setBudgets,
    debts, setDebts,
    savingsGoals, setSavingsGoals,
    recurringTransactions, setRecurringTransactions,
    appSettings
  } = useApp();
  const { setHoveredItem } = useHover();
  const { currentLevel } = useLevel();

  const privacyClass = appSettings.finance.privacyMode ? 'blur-md select-none' : '';

  const [activeTab, setActiveTab] = useState('overview');
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    category: 'General'
  });

  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [incomeFrequency, setIncomeFrequency] = useState('monthly');
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // State for Edit/View Details
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isBudgetDetailsOpen, setIsBudgetDetailsOpen] = useState(false);
  const [contributionAmount, setContributionAmount] = useState<number>(0);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositSourceAccountId, setDepositSourceAccountId] = useState<string>('');
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  // --- Edit States ---
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);

  const [editingIncome, setEditingIncome] = useState<RecurringTransaction | null>(null);
  const [isEditIncomeOpen, setIsEditIncomeOpen] = useState(false);

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);

  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);

  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isEditDebtOpen, setIsEditDebtOpen] = useState(false);


  // --- Calculations ---
  const totalBalance = accounts.reduce((sum, acc) => {
    return acc.type === 'credit' || acc.type === 'loan' ? sum - acc.balance : sum + acc.balance;
  }, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    // Treat date as local date string YYYY-MM-DD
    if (!t.date) return false;
    const [year, month] = t.date.split('-').map(Number);
    // JS months are 0-indexed (0=Jan, 11=Dec)
    // t.date "2024-05-XX" -> year 2024, month 5.
    // currentMonth is 0-11.
    return (month - 1) === currentMonth && year === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  // --- Previous Month Calculations ---
  const prevMonthDate = new Date();
  prevMonthDate.setMonth(currentMonth - 1);
  const prevMonth = prevMonthDate.getMonth();
  const prevMonthYear = prevMonthDate.getFullYear();

  const prevMonthTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const [year, month] = t.date.split('-').map(Number);
    return (month - 1) === prevMonth && year === prevMonthYear;
  });

  const prevMonthIncome = prevMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeChange = prevMonthIncome > 0 
    ? ((monthlyIncome - prevMonthIncome) / prevMonthIncome) * 100 
    : monthlyIncome > 0 ? 100 : 0;

  const incomeChangeText = prevMonthIncome === 0 && monthlyIncome > 0 
    ? "First month of income" 
    : `${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}% from last month`;

  // --- Budget Status ---
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.amount, 0);
  const budgetStatus = totalBudgetLimit > 0 
    ? monthlyExpenses > totalBudgetLimit 
        ? `Over budget by $${(monthlyExpenses - totalBudgetLimit).toLocaleString()}`
        : `Within budget ($${(totalBudgetLimit - monthlyExpenses).toLocaleString()} left)`
    : "No budget limit set";

  // --- Net Worth Fallback ---
  // If no accounts exist, calculate pseudo-net worth from all-time transactions
  const allTimeIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const allTimeExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const displayNetWorth = accounts.length > 0 ? totalBalance : (allTimeIncome - allTimeExpenses);

  const expensesByCategory = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Line Chart Data (Last 30 days)
  const lineChartData = useMemo(() => {
    const data: Record<string, { date: string; income: number; expense: number }> = {};
    const today = new Date();
    
    // Initialize last 14 days
    for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toLocaleDateString();
        data[dateStr] = { date: dateStr.split('/')[0] + '/' + dateStr.split('/')[1], income: 0, expense: 0 }; // Short date
    }

    transactions.forEach(t => {
        const d = new Date(t.date);
        // Only include if within last 14 days approx
        if ((today.getTime() - d.getTime()) / (1000 * 3600 * 24) < 14) {
             const dateStr = d.toLocaleDateString();
             if (data[dateStr]) {
                 if (t.type === 'income') data[dateStr].income += t.amount;
                 else data[dateStr].expense += t.amount;
             }
        }
    });

    return Object.values(data);
  }, [transactions]);

  // --- Handlers ---
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newAccount: Account = {
        id: crypto.randomUUID(),
        name: formData.get('name') as string,
        balance: Number(formData.get('balance')),
        type: formData.get('type') as any
    };
    setAccounts([...accounts, newAccount]);
    setIsAddAccountOpen(false);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const updateAccountBalance = (accountId: string, amount: number, type: 'income' | 'expense') => {
      if (!accountId || accountId === 'default') return;
      const updatedAccounts = accounts.map(acc => {
          if (acc.id === accountId) {
              const newBalance = type === 'income' ? acc.balance + amount : acc.balance - amount;
              return { ...acc, balance: newBalance };
          }
          return acc;
      });
      setAccounts(updatedAccounts);
  };

  const handleAddTransaction = () => {
    if (!newTransaction.amount || !newTransaction.description) return;
    
    const transaction: Transaction = {
        id: crypto.randomUUID(),
        description: newTransaction.description || '',
        amount: Number(newTransaction.amount),
        type: newTransaction.type as 'income' | 'expense',
        date: newTransaction.date || new Date().toISOString(),
        accountId: newTransaction.accountId || (accounts[0]?.id || 'default'),
        category: newTransaction.category || 'General'
    };
    
    setTransactions([transaction, ...transactions]);
    updateAccountBalance(transaction.accountId, transaction.amount, transaction.type);
    
    setIsAddTransactionOpen(false);
    setNewTransaction({
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        description: '',
        category: 'General',
        accountId: accounts[0]?.id || 'default'
    });
  };

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const amount = Number(formData.get('amount'));
    const name = formData.get('name') as string;
    const frequency = formData.get('frequency') as string;
    const accountId = formData.get('accountId') as string;
    const logNow = formData.get('logNow') === 'on';

    if (frequency === 'one-time') {
        const transaction: Transaction = {
            id: crypto.randomUUID(),
            description: name,
            amount: amount,
            type: 'income',
            date: new Date().toISOString().split('T')[0],
            accountId: accountId || (accounts[0]?.id || 'default'),
            category: 'Income'
        };
        setTransactions([transaction, ...transactions]);
        updateAccountBalance(transaction.accountId, amount, 'income');
    } else {
        const newIncome: RecurringTransaction = {
            id: crypto.randomUUID(),
            name: name,
            amount: amount,
            type: 'income',
            category: 'Income',
            frequency: frequency as any,
            nextDueDate: formData.get('nextDueDate') as string,
            accountId: accountId || (accounts[0]?.id || 'default'),
            active: true
        };
        setRecurringTransactions([...recurringTransactions, newIncome]);
        
        // Automatically add first transaction if requested
        if (logNow) {
            const transaction: Transaction = {
                id: crypto.randomUUID(),
                description: name,
                amount: amount,
                type: 'income',
                date: new Date().toISOString().split('T')[0],
                accountId: accountId || (accounts[0]?.id || 'default'),
                category: 'Income'
            };
            setTransactions([transaction, ...transactions]);
            updateAccountBalance(transaction.accountId, amount, 'income');
        }
    }

    setIsAddIncomeOpen(false);
  };

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const amount = Number(formData.get('amount'));
    const category = formData.get('category') as string;
    
    // Check if budget for this category already exists
    if (budgets.some(b => b.category === category)) {
        alert(`A budget for ${category} already exists.`);
        return;
    }

    const newBudget: Budget = {
        id: crypto.randomUUID(),
        name: category,
        amount: amount,
        category: category,
        period: 'monthly'
    };
    setBudgets([...budgets, newBudget]);
    setIsAddBudgetOpen(false);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newGoal: SavingsGoal = {
        id: crypto.randomUUID(),
        name: formData.get('name') as string,
        targetAmount: Number(formData.get('targetAmount')),
        currentAmount: Number(formData.get('currentAmount')),
        deadline: formData.get('deadline') as string,
        category: 'purchase',
        monthlyContribution: 0
    };
    setSavingsGoals([...savingsGoals, newGoal]);
    setIsAddGoalOpen(false);
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newDebt: Debt = {
        id: crypto.randomUUID(),
        name: formData.get('name') as string,
        balance: Number(formData.get('balance')),
        interestRate: Number(formData.get('interestRate')),
        minimumPayment: Number(formData.get('minimumPayment')),
        dueDate: 1,
        strategy: 'avalanche',
        accountId: formData.get('accountId') as string
    };
    setDebts([...debts, newDebt]);
    setIsAddDebtOpen(false);
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id));
  };

  const handleDeleteGoal = (id: string) => {
    setSavingsGoals(savingsGoals.filter(g => g.id !== id));
  };

  const handleDeleteIncome = (id: string) => {
    setRecurringTransactions(recurringTransactions.filter(t => t.id !== id));
  };

  const handleDeleteDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  const handleDeleteTransaction = (t: Transaction) => {
    setTransactions(transactions.filter(tr => tr.id !== t.id));
    // Revert balance
    updateAccountBalance(t.accountId, t.amount, t.type === 'income' ? 'expense' : 'income');
  };

  const handleDepositToGoal = () => {
    if (!selectedGoal || contributionAmount <= 0) return;
    
    // Update goal amount
    const updatedGoals = savingsGoals.map(g => 
        g.id === selectedGoal.id 
            ? { ...g, currentAmount: g.currentAmount + contributionAmount } 
            : g
    );
    setSavingsGoals(updatedGoals);

    // Optionally create a transaction record
    const sourceAccount = depositSourceAccountId || accounts[0]?.id || 'default';
    const transaction: Transaction = {
        id: crypto.randomUUID(),
        description: `Deposit to ${selectedGoal.name}`,
        amount: contributionAmount,
        type: 'expense', // Treated as expense from checking, or transfer
        date: new Date().toISOString(),
        accountId: sourceAccount,
        category: 'Savings'
    };
    setTransactions([transaction, ...transactions]);
    updateAccountBalance(sourceAccount, contributionAmount, 'expense');

    setIsDepositOpen(false);
    setContributionAmount(0);
    setSelectedGoal(null);
    setDepositSourceAccountId('');
  };

  const handleUpdateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const updatedTransactions = transactions.map(t => 
      t.id === editingTransaction.id ? editingTransaction : t
    );
    
    // Calculate difference to update account balance
    const original = transactions.find(t => t.id === editingTransaction.id);
    if (original) {
        // Revert original balance change
        updateAccountBalance(original.accountId, original.amount, original.type === 'income' ? 'expense' : 'income');
        // Apply new balance change
        updateAccountBalance(editingTransaction.accountId, editingTransaction.amount, editingTransaction.type);
    }

    setTransactions(updatedTransactions);
    setIsEditTransactionOpen(false);
    setEditingTransaction(null);
  };

  const handleUpdateIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncome) return;
    setRecurringTransactions(recurringTransactions.map(t => t.id === editingIncome.id ? editingIncome : t));
    setIsEditIncomeOpen(false);
    setEditingIncome(null);
  };

  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    setBudgets(budgets.map(b => b.id === editingBudget.id ? editingBudget : b));
    setIsEditBudgetOpen(false);
    setEditingBudget(null);
  };

  const handleUpdateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;
    setSavingsGoals(savingsGoals.map(g => g.id === editingGoal.id ? editingGoal : g));
    setIsEditGoalOpen(false);
    setEditingGoal(null);
  };

  const handleUpdateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt) return;
    setDebts(debts.map(d => d.id === editingDebt.id ? editingDebt : d));
    setIsEditDebtOpen(false);
    setEditingDebt(null);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Budgeting Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    
    doc.text(`Net Worth: $${totalBalance.toFixed(2)}`, 20, 50);
    doc.text(`Monthly Income: $${monthlyIncome.toFixed(2)}`, 20, 60);
    doc.text(`Monthly Expenses: $${monthlyExpenses.toFixed(2)}`, 20, 70);
    
    doc.save('budgeting-report.pdf');
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(transactions);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "budgeting-data.xlsx");
  };

  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="mb-2 font-medium">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="capitalize text-muted-foreground">{entry.name}:</span>
                        <span className={cn("font-medium", privacyClass)}>${entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className={cn("font-medium", privacyClass)}>{payload[0].name}: ${payload[0].value}</p>
            </div>
        );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgeting</h1>
          <p className="text-muted-foreground">Master your money. Expose reality. Create control.</p>
        </div>
        <div className="flex gap-2">
           <Dialog open={isAddIncomeOpen} onOpenChange={setIsAddIncomeOpen}>
               <DialogTrigger asChild><Button variant="secondary"><Plus className="w-4 h-4 mr-2"/> Add Income</Button></DialogTrigger>
               <DialogContent>
                   <DialogHeader><DialogTitle>Add Income Stream</DialogTitle></DialogHeader>
                   <form onSubmit={handleAddIncome} className="grid gap-4 py-4">
                       <div className="grid grid-cols-4 items-center gap-4">
                           <Label className="text-right">Name</Label>
                           <Input name="name" className="col-span-3" required />
                       </div>
                       <div className="grid grid-cols-4 items-center gap-4">
                           <Label className="text-right">Amount</Label>
                           <Input name="amount" type="number" className="col-span-3" required />
                       </div>
                       <div className="grid grid-cols-4 items-center gap-4">
                           <Label className="text-right">Account</Label>
                           <Select name="accountId" defaultValue={accounts[0]?.id || 'default'}>
                               <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Account" /></SelectTrigger>
                               <SelectContent>
                                   {accounts.map(acc => (
                                       <SelectItem key={acc.id} value={acc.id}>{acc.name} (${acc.balance})</SelectItem>
                                   ))}
                                   {accounts.length === 0 && <SelectItem value="default">Default Account</SelectItem>}
                               </SelectContent>
                           </Select>
                       </div>
                       <div className="grid grid-cols-4 items-center gap-4">
                           <Label className="text-right">Frequency</Label>
                           <Select name="frequency" value={incomeFrequency} onValueChange={setIncomeFrequency}>
                               <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                               <SelectContent>
                                   <SelectItem value="one-time">One-Time</SelectItem>
                                   <SelectItem value="weekly">Weekly</SelectItem>
                                   <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                                   <SelectItem value="monthly">Monthly</SelectItem>
                               </SelectContent>
                           </Select>
                       </div>
                       {incomeFrequency !== 'one-time' && (
                           <>
                               <div className="grid grid-cols-4 items-center gap-4">
                                   <Label className="text-right">Next Payday</Label>
                                   <Input name="nextDueDate" type="date" className="col-span-3" required />
                               </div>
                               <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right" />
                                    <div className="col-span-3 flex items-center gap-2">
                                        <input type="checkbox" id="logNow" name="logNow" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                                        <Label htmlFor="logNow" className="font-normal">Log first payment now?</Label>
                                    </div>
                               </div>
                           </>
                       )}
                       <Button type="submit">Save</Button>
                   </form>
               </DialogContent>
           </Dialog>

           <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
             <DialogTrigger asChild>
               <Button><Plus className="w-4 h-4 mr-2" /> Add Transaction</Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Add Transaction</DialogTitle>
                 <DialogDescription>Record a new income or expense.</DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label className="text-right">Type</Label>
                   <Select 
                     value={newTransaction.type} 
                     onValueChange={(val: any) => setNewTransaction({...newTransaction, type: val})}
                   >
                     <SelectTrigger className="col-span-3">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="expense">Expense</SelectItem>
                       <SelectItem value="income">Income</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label className="text-right">Amount</Label>
                   <Input 
                     type="number" 
                     className="col-span-3" 
                     value={newTransaction.amount} 
                     onChange={e => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                   />
                 </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label className="text-right">Account</Label>
                   <Select 
                     value={newTransaction.accountId} 
                     onValueChange={(val: any) => setNewTransaction({...newTransaction, accountId: val})}
                   >
                     <SelectTrigger className="col-span-3">
                       <SelectValue placeholder="Select Account" />
                     </SelectTrigger>
                     <SelectContent>
                       {accounts.map(acc => (
                           <SelectItem key={acc.id} value={acc.id}>{acc.name} (${acc.balance})</SelectItem>
                       ))}
                       {accounts.length === 0 && <SelectItem value="default">Default Account</SelectItem>}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label className="text-right">Description</Label>
                   <Input 
                     className="col-span-3" 
                     value={newTransaction.description} 
                     onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                   />
                 </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label className="text-right">Category</Label>
                   <Input 
                     className="col-span-3" 
                     value={newTransaction.category} 
                     onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                     list="category-suggestions"
                   />
                   <datalist id="category-suggestions">
                       <option value="Food" />
                       <option value="Groceries" />
                       <option value="Housing" />
                       <option value="Transport" />
                       <option value="Utilities" />
                       <option value="Entertainment" />
                       <option value="Health" />
                       <option value="Shopping" />
                       <option value="Income" />
                   </datalist>
                 </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label className="text-right">Date</Label>
                   <Input 
                     type="date" 
                     className="col-span-3" 
                     value={newTransaction.date} 
                     onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                   />
                 </div>
               </div>
               <DialogFooter>
                 <Button onClick={handleAddTransaction}>Save Transaction</Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
           <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportPDF}>
                        <Download className="w-4 h-4 mr-2" /> Export to PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportExcel}>
                        <Download className="w-4 h-4 mr-2" /> Export to Excel
                    </DropdownMenuItem>
                </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-center w-full overflow-x-auto pb-2">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="accounts">Accounts</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="budget">Budget</TabsTrigger>
                <TabsTrigger value="savings">Savings</TabsTrigger>
                <TabsTrigger value="debt">Debt</TabsTrigger>
            </TabsList>
        </div>

        {/* 1. Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", privacyClass)}>${displayNetWorth.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{accounts.length > 0 ? "Across all accounts" : "Based on transaction history"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", privacyClass)}>${monthlyIncome.toLocaleString()}</div>
                <p className={cn("text-xs", incomeChange >= 0 ? "text-green-600" : "text-red-500")}>{incomeChangeText}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", privacyClass)}>${monthlyExpenses.toLocaleString()}</div>
                <p className={cn("text-xs", monthlyExpenses > totalBudgetLimit && totalBudgetLimit > 0 ? "text-red-500" : "text-muted-foreground")}>{budgetStatus}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{savingsRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Target: 20%</p>
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
            {currentLevel < 10 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-muted p-4 rounded-full mb-4">
                            <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Advanced Analytics Locked</h3>
                        <p className="text-muted-foreground max-w-md mb-6">
                            Reach Level 10 to unlock detailed financial insights, trends, and spending breakdowns.
                        </p>
                        <Badge variant="secondary" className="text-sm px-4 py-1">Required: Level 10</Badge>
                    </CardContent>
                </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Income & Expense Trend (Last 14 Days)</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={lineChartData}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tickMargin={10} />
                        <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                        <Tooltip content={<CustomAreaTooltip />} cursor={{ fill: 'transparent' }} />
                        <Legend />
                        <Area type="monotone" dataKey="income" stroke="#82ca9d" fillOpacity={1} fill="url(#colorIncome)" name="Income" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="expense" stroke="#8884d8" fillOpacity={1} fill="url(#colorExpense)" name="Expenses" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Spending Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
        </TabsContent>

        {/* 2. Accounts Manager */}
        <TabsContent value="accounts">
           <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium">Accounts</h3>
               <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
                   <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Account</Button></DialogTrigger>
                   <DialogContent>
                       <DialogHeader><DialogTitle>Add Account</DialogTitle></DialogHeader>
                       <form onSubmit={handleAddAccount} className="grid gap-4 py-4">
                           <div className="grid grid-cols-4 items-center gap-4">
                               <Label className="text-right">Name</Label>
                               <Input name="name" className="col-span-3" required placeholder="e.g. Chase Checking" />
                           </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                               <Label className="text-right">Type</Label>
                               <Select name="type" defaultValue="checking">
                                   <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                   <SelectContent>
                                       <SelectItem value="checking">Checking</SelectItem>
                                       <SelectItem value="savings">Savings</SelectItem>
                                       <SelectItem value="credit">Credit Card</SelectItem>
                                       <SelectItem value="investment">Investment</SelectItem>
                                       <SelectItem value="loan">Loan</SelectItem>
                                       <SelectItem value="cash">Cash</SelectItem>
                                   </SelectContent>
                               </Select>
                           </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                               <Label className="text-right">Balance</Label>
                               <Input name="balance" type="number" step="0.01" className="col-span-3" required />
                           </div>
                           <Button type="submit">Save Account</Button>
                       </form>
                   </DialogContent>
               </Dialog>
           </div>
           <div className="grid gap-4 md:grid-cols-3">
               {accounts.map(acc => (
                   <ContextMenu key={acc.id}>
                       <ContextMenuTrigger asChild>
                           <Card 
                                onMouseEnter={() => setHoveredItem({
                                    type: 'account',
                                    data: {
                                        ...acc,
                                        onEdit: () => {
                                            setEditingAccount(acc);
                                            setIsEditAccountOpen(true);
                                        },
                                        onDelete: () => handleDeleteAccount(acc.id)
                                    }
                                })}
                                onMouseLeave={() => setHoveredItem(null)}
                           >
                               <CardHeader className="flex flex-row items-center justify-between pb-2">
                                   <div className="flex items-center gap-2">
                                     <CardTitle className="text-base font-medium">{acc.name}</CardTitle>
                                     {acc.type === 'checking' && <CreditCard className="h-4 w-4 text-muted-foreground" />}
                                     {acc.type === 'savings' && <Wallet className="h-4 w-4 text-muted-foreground" />}
                                     {acc.type === 'credit' && <CreditCard className="h-4 w-4 text-red-400" />}
                                     {acc.type === 'investment' && <TrendingUp className="h-4 w-4 text-green-400" />}
                                   </div>
                                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAccount(acc); setIsEditAccountOpen(true); }}>
                                       <Edit2 className="h-4 w-4" />
                                   </Button>
                               </CardHeader>
                               <CardContent>
                                   <div className={cn("text-2xl font-bold", privacyClass)}>${acc.balance.toLocaleString()}</div>
                                   <p className="text-xs text-muted-foreground capitalize">{acc.type} Account</p>
                               </CardContent>
                           </Card>
                       </ContextMenuTrigger>
                       <ContextMenuContent className="w-56">
                           <ContextMenuItem onClick={() => { setEditingAccount(acc); setIsEditAccountOpen(true); }}>
                               <Edit2 className="h-4 w-4 mr-2" /> Edit Account
                           </ContextMenuItem>
                           <ContextMenuItem className="text-destructive" onClick={() => handleDeleteAccount(acc.id)}>
                               <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                           </ContextMenuItem>
                       </ContextMenuContent>
                   </ContextMenu>
               ))}
               {accounts.length === 0 && (
                   <div className="col-span-3 text-center py-10 text-muted-foreground">
                       No accounts found. Add one to get started!
                   </div>
               )}
           </div>

           <Dialog open={isEditAccountOpen} onOpenChange={setIsEditAccountOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Account</DialogTitle></DialogHeader>
                    {editingAccount && (
                        <form onSubmit={handleUpdateAccount} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Name</Label>
                                <Input 
                                    value={editingAccount.name} 
                                    onChange={e => setEditingAccount({...editingAccount, name: e.target.value})} 
                                    className="col-span-3" 
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Type</Label>
                                <Select 
                                    value={editingAccount.type} 
                                    onValueChange={(val: any) => setEditingAccount({...editingAccount, type: val})}
                                >
                                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="checking">Checking</SelectItem>
                                        <SelectItem value="savings">Savings</SelectItem>
                                        <SelectItem value="credit">Credit Card</SelectItem>
                                        <SelectItem value="investment">Investment</SelectItem>
                                        <SelectItem value="loan">Loan</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Balance</Label>
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    value={editingAccount.balance} 
                                    onChange={e => setEditingAccount({...editingAccount, balance: parseFloat(e.target.value)})} 
                                    className="col-span-3" 
                                    required 
                                />
                            </div>
                            <Button type="submit">Update Account</Button>
                        </form>
                    )}
                </DialogContent>
           </Dialog>
        </TabsContent>

        {/* 2. Income Manager */}
        <TabsContent value="income">
           <Card>
             <CardHeader>
               <CardTitle>Income Streams</CardTitle>
               <CardDescription>Manage your income sources and track regular earnings.</CardDescription>
             </CardHeader>
             <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Source</TableHead>
                     <TableHead>Amount</TableHead>
                     <TableHead>Frequency</TableHead>
                     <TableHead>Next Payday</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {recurringTransactions.filter(t => t.type === 'income').map(t => (
                    <ContextMenu key={t.id}>
                        <ContextMenuTrigger asChild>
                            <TableRow>
                              <TableCell>{t.name}</TableCell>
                              <TableCell className={privacyClass}>${t.amount}</TableCell>
                              <TableCell className="capitalize">{t.frequency}</TableCell>
                              <TableCell>{new Date(t.nextDueDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                  <Button variant="ghost" size="icon" onClick={() => { setEditingIncome(t); setIsEditIncomeOpen(true); }}>
                                      <Edit2 className="w-4 h-4" />
                                  </Button>
                              </TableCell>
                            </TableRow>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-56">
                            <ContextMenuItem onClick={() => { setEditingIncome(t); setIsEditIncomeOpen(true); }}>
                                <Edit2 className="h-4 w-4 mr-2" /> Edit Income
                            </ContextMenuItem>
                            <ContextMenuItem className="text-destructive" onClick={() => handleDeleteIncome(t.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Income
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                  ))}
                   {recurringTransactions.filter(t => t.type === 'income').length === 0 && (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center text-muted-foreground">No recurring income set up.</TableCell>
                     </TableRow>
                   )}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>
        </TabsContent>

        {/* 3. Expense Tracker */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Review and categorize your spending.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Date</TableHead>
                     <TableHead>Description</TableHead>
                     <TableHead>Category</TableHead>
                     <TableHead className="text-right">Amount</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {transactions.slice(0, 10).map(t => (
                    <ContextMenu key={t.id}>
                        <ContextMenuTrigger asChild>
                            <TableRow 
                                onMouseEnter={() => setHoveredItem({
                                    type: 'transaction',
                                    data: {
                                        ...t,
                                        onEdit: () => {
                                            setEditingTransaction(t);
                                            setIsEditTransactionOpen(true);
                                        },
                                        onDelete: () => {
                                            setTransactions(transactions.filter(tr => tr.id !== t.id));
                                            // Revert balance
                                            updateAccountBalance(t.accountId, t.amount, t.type === 'income' ? 'expense' : 'income');
                                        }
                                    }
                                })}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                              <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                              <TableCell>{t.description}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{t.category}</Badge>
                              </TableCell>
                              <TableCell className={cn("text-right font-medium", t.type === 'income' ? 'text-green-600' : 'text-red-600', privacyClass)}>
                                {t.type === 'income' ? '+' : '-'}${t.amount}
                              </TableCell>
                              <TableCell>
                                  <Button variant="ghost" size="icon" onClick={() => { setEditingTransaction(t); setIsEditTransactionOpen(true); }}>
                                      <Edit2 className="w-4 h-4" />
                                  </Button>
                              </TableCell>
                            </TableRow>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-56">
                            <ContextMenuItem onClick={() => { setEditingTransaction(t); setIsEditTransactionOpen(true); }}>
                                <Edit2 className="h-4 w-4 mr-2" /> Edit Transaction
                            </ContextMenuItem>
                            <ContextMenuItem className="text-destructive" onClick={() => handleDeleteTransaction(t)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Transaction
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                  ))}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Budget Builder */}
        <TabsContent value="budget">
           <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium">Monthly Budgets</h3>
               <Dialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
                   <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Budget</Button></DialogTrigger>
                   <DialogContent>
                       <DialogHeader><DialogTitle>Add Budget Category</DialogTitle></DialogHeader>
                       <form onSubmit={handleAddBudget} className="grid gap-4 py-4">
                       <div className="grid grid-cols-4 items-center gap-4">
                           <Label className="text-right">Category</Label>
                           <Input 
                             name="category" 
                             className="col-span-3" 
                             required 
                             placeholder="e.g. Groceries"
                             list="budget-categories"
                           />
                           <datalist id="budget-categories">
                               <option value="Groceries" />
                               <option value="Housing" />
                               <option value="Transport" />
                               <option value="Utilities" />
                               <option value="Entertainment" />
                               <option value="Health" />
                               <option value="Shopping" />
                           </datalist>
                       </div>
                       <div className="grid grid-cols-4 items-center gap-4">
                           <Label className="text-right">Limit ($)</Label>
                           <Input name="amount" type="number" className="col-span-3" required />
                       </div>
                       <Button type="submit">Set Budget</Button>
                   </form>
                   </DialogContent>
               </Dialog>
           </div>
           <div className="grid gap-4 md:grid-cols-2">
             {budgets.map(budget => {
                const spent = transactions
                  .filter(t => t.type === 'expense' && t.category.toLowerCase() === budget.category.toLowerCase())
                  .reduce((sum, t) => sum + t.amount, 0);
                const percent = Math.min((spent / budget.amount) * 100, 100);
                
                return (
                  <ContextMenu key={budget.id}>
                      <ContextMenuTrigger asChild>
                          <Card className="relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <div className="space-y-1">
                                <CardTitle className="text-base font-medium">{budget.category}</CardTitle>
                                <p className="text-xs text-muted-foreground">Limit: ${budget.amount}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                   <DropdownMenuItem onClick={() => { setSelectedBudget(budget); setIsBudgetDetailsOpen(true); }}>
                                      <FileText className="mr-2 h-4 w-4" /> View Transactions
                                   </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => handleDeleteBudget(budget.id)} className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete Budget
                                   </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                              <div className="flex justify-between items-end mb-2">
                                 <div className={cn("text-2xl font-bold", privacyClass)}>${spent}</div>
                                 <div className="text-xs text-muted-foreground mb-1">
                                    {percent >= 100 ? 'Over Limit' : `${(100 - percent).toFixed(0)}% Left`}
                                 </div>
                              </div>
                              <Progress value={percent} className={cn("h-2", percent > 100 ? "bg-red-200" : "")} />
                              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                                 <span className={privacyClass}>Spent</span>
                                 <span className={privacyClass}>${budget.amount - spent} Remaining</span>
                              </div>
                            </CardContent>
                          </Card>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-56">
                          <ContextMenuItem onClick={() => { setSelectedBudget(budget); setIsBudgetDetailsOpen(true); }}>
                              <FileText className="mr-2 h-4 w-4" /> View Transactions
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => { setEditingBudget(budget); setIsEditBudgetOpen(true); }}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit Budget
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleDeleteBudget(budget.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Budget
                          </ContextMenuItem>
                      </ContextMenuContent>
                  </ContextMenu>
                );
             })}
           </div>

           {/* Budget Details Dialog */}
           <Dialog open={isBudgetDetailsOpen} onOpenChange={setIsBudgetDetailsOpen}>
             <DialogContent className="max-w-md">
               <DialogHeader>
                 <DialogTitle>{selectedBudget?.category} Details</DialogTitle>
                 <DialogDescription>Recent transactions for this category.</DialogDescription>
               </DialogHeader>
               <ScrollArea className="h-[300px] w-full pr-4">
                 <div className="space-y-4">
                   {selectedBudget && transactions
                     .filter(t => t.type === 'expense' && t.category.toLowerCase() === selectedBudget.category.toLowerCase())
                     .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                     .slice(0, 20)
                     .map(t => (
                       <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                         <div>
                           <p className="text-sm font-medium">{t.description}</p>
                           <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                         </div>
                         <div className={cn("font-bold text-red-600", privacyClass)}>-${t.amount}</div>
                       </div>
                   ))}
                   {selectedBudget && transactions.filter(t => t.type === 'expense' && t.category.toLowerCase() === selectedBudget.category.toLowerCase()).length === 0 && (
                       <p className="text-center text-muted-foreground py-8">No transactions found for this budget.</p>
                   )}
                 </div>
               </ScrollArea>
             </DialogContent>
           </Dialog>
        </TabsContent>

        {/* 5. Savings & Goals */}
        <TabsContent value="savings">
          <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium">Savings Goals</h3>
               <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
                   <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Goal</Button></DialogTrigger>
                   <DialogContent>
                       <DialogHeader><DialogTitle>Add Savings Goal</DialogTitle></DialogHeader>
                       <form onSubmit={handleAddGoal} className="grid gap-4 py-4">
                           <div className="grid grid-cols-4 items-center gap-4">
                               <Label className="text-right">Goal Name</Label>
                               <Input name="name" className="col-span-3" required />
                           </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                               <Label className="text-right">Target Amount</Label>
                               <Input name="targetAmount" type="number" className="col-span-3" required />
                           </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                               <Label className="text-right">Current Amount</Label>
                               <Input name="currentAmount" type="number" defaultValue="0" className="col-span-3" required />
                           </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                               <Label className="text-right">Deadline</Label>
                               <Input name="deadline" type="date" className="col-span-3" />
                           </div>
                           <Button type="submit">Save</Button>
                       </form>
                   </DialogContent>
               </Dialog>
           </div>
          <div className="grid gap-4 md:grid-cols-3">
            {savingsGoals.map(goal => {
               // Calculate months to reach goal if contributing monthly
               let monthsLeft = 0;
               if (goal.monthlyContribution > 0) {
                   monthsLeft = Math.ceil((goal.targetAmount - goal.currentAmount) / goal.monthlyContribution);
               }
               
               return (
                <ContextMenu key={goal.id}>
                    <ContextMenuTrigger asChild>
                        <Card>
                          <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-lg">{goal.name}</CardTitle>
                                <CardDescription>{goal.category}</CardDescription>
                            </div>
                            <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedGoal(goal); setIsDepositOpen(true); }}>
                                     <Plus className="mr-2 h-4 w-4" /> Add Funds
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setEditingGoal(goal); setIsEditGoalOpen(true); }}>
                                     <Edit2 className="mr-2 h-4 w-4" /> Edit Goal
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteGoal(goal.id)} className="text-red-600">
                                     <Trash2 className="mr-2 h-4 w-4" /> Delete Goal
                                  </DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-end mb-2">
                                <div className={cn("text-2xl font-bold", privacyClass)}>${goal.currentAmount.toLocaleString()}</div>
                                <div className={cn("text-sm text-muted-foreground", privacyClass)}>of ${goal.targetAmount.toLocaleString()}</div>
                            </div>
                            <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="h-2" />
                            
                            <div className="mt-4 flex items-center justify-between">
                                 <Button variant="outline" size="sm" className="w-full" onClick={() => { setSelectedGoal(goal); setIsDepositOpen(true); }}>
                                    <Plus className="w-3 h-3 mr-2" /> Add Funds
                                 </Button>
                            </div>

                            <div className="mt-3 text-xs text-muted-foreground space-y-1">
                              {goal.deadline && <p>Deadline: {new Date(goal.deadline).toLocaleDateString()}</p>}
                              {goal.monthlyContribution > 0 && (
                                  <p>At <span className={privacyClass}>${goal.monthlyContribution}</span>/mo, you'll finish in ~{monthsLeft} months.</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-56">
                        <ContextMenuItem onClick={() => { setSelectedGoal(goal); setIsDepositOpen(true); }}>
                             <Plus className="mr-2 h-4 w-4" /> Add Funds
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => { setEditingGoal(goal); setIsEditGoalOpen(true); }}>
                             <Edit2 className="mr-2 h-4 w-4" /> Edit Goal
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleDeleteGoal(goal.id)} className="text-destructive">
                             <Trash2 className="mr-2 h-4 w-4" /> Delete Goal
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>

          {/* Deposit Dialog */}
          <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
             <DialogContent>
                 <DialogHeader>
                     <DialogTitle>Add Funds to {selectedGoal?.name}</DialogTitle>
                     <DialogDescription>
                         Add money to this savings goal. This will also create an expense transaction.
                     </DialogDescription>
                 </DialogHeader>
                 <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label className="text-right">From Account</Label>
                         <Select 
                           value={depositSourceAccountId} 
                           onValueChange={setDepositSourceAccountId}
                         >
                             <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Source Account" /></SelectTrigger>
                             <SelectContent>
                                 {accounts.filter(a => a.type === 'checking' || a.type === 'savings' || a.type === 'cash').map(acc => (
                                     <SelectItem key={acc.id} value={acc.id}>{acc.name} (${acc.balance})</SelectItem>
                                 ))}
                                 {accounts.length === 0 && <SelectItem value="default">Default Account</SelectItem>}
                             </SelectContent>
                         </Select>
                     </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label className="text-right">Amount</Label>
                         <Input 
                            type="number" 
                            className="col-span-3" 
                            value={contributionAmount} 
                            onChange={e => setContributionAmount(Number(e.target.value))}
                            autoFocus
                         />
                     </div>
                 </div>
                 <DialogFooter>
                     <Button onClick={handleDepositToGoal}>Confirm Deposit</Button>
                 </DialogFooter>
             </DialogContent>
          </Dialog>
        </TabsContent>

        {/* 6. Debt Manager */}
        <TabsContent value="debt">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <div>
                   <CardTitle>Debt Snowball</CardTitle>
                   <CardDescription>Kill your debt strategically.</CardDescription>
               </div>
               <Dialog open={isAddDebtOpen} onOpenChange={setIsAddDebtOpen}>
                   <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Debt</Button></DialogTrigger>
                   <DialogContent>
                       <DialogHeader><DialogTitle>Add Debt</DialogTitle></DialogHeader>
                       <form onSubmit={handleAddDebt} className="grid gap-4 py-4">
                           <div className="grid grid-cols-4 items-center gap-4">
                               <Label className="text-right">Debt Name</Label>
                               <Input name="name" className="col-span-3" required />
                           </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                               <Label className="text-right">Linked Account</Label>
                               <Select name="accountId">
                                   <SelectTrigger className="col-span-3"><SelectValue placeholder="Optional Link" /></SelectTrigger>
                                   <SelectContent>
                                       {accounts.filter(a => a.type === 'credit' || a.type === 'loan').map(acc => (
                                           <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                       ))}
                                       <SelectItem value="none">None</SelectItem>
                                   </SelectContent>
                               </Select>
                           </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                               <Label className="text-right">Balance</Label>
                               <Input name="balance" type="number" className="col-span-3" required />
                           </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                               <Label className="text-right">Interest Rate %</Label>
                               <Input name="interestRate" type="number" step="0.1" className="col-span-3" required />
                           </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                               <Label className="text-right">Min Payment</Label>
                               <Input name="minimumPayment" type="number" className="col-span-3" required />
                           </div>
                           <Button type="submit">Save</Button>
                       </form>
                   </DialogContent>
               </Dialog>
             </CardHeader>
             <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Debt Name</TableHead>
                     <TableHead>Balance</TableHead>
                     <TableHead>Interest Rate</TableHead>
                     <TableHead>Min Payment</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {debts.map(debt => (
                    <ContextMenu key={debt.id}>
                        <ContextMenuTrigger asChild>
                            <TableRow>
                              <TableCell>{debt.name}</TableCell>
                              <TableCell className={privacyClass}>${debt.balance}</TableCell>
                              <TableCell>{debt.interestRate}%</TableCell>
                              <TableCell className={privacyClass}>${debt.minimumPayment}</TableCell>
                              <TableCell>
                                  <Button variant="ghost" size="icon" onClick={() => { setEditingDebt(debt); setIsEditDebtOpen(true); }}>
                                      <Edit2 className="w-4 h-4" />
                                  </Button>
                              </TableCell>
                            </TableRow>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                            <ContextMenuItem onClick={() => {
                                const url = window.location.origin + '/budgeting?debt=' + debt.id;
                                window.open(url, '_blank');
                            }}>
                                <ExternalLink className="mr-2 h-4 w-4" /> Open in New Tab
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => {
                                const url = window.location.origin + '/budgeting?debt=' + debt.id;
                                copyToClipboard(url);
                            }}>
                                <Copy className="mr-2 h-4 w-4" /> Copy Link
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => { setEditingDebt(debt); setIsEditDebtOpen(true); }}>
                                <Edit2 className="h-4 w-4 mr-2" /> Edit Debt
                            </ContextMenuItem>
                            <ContextMenuItem className="text-destructive" onClick={() => handleDeleteDebt(debt.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Debt
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                  ))}
                   {debts.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center text-muted-foreground">Debt free! Congratulations.</TableCell>
                     </TableRow>
                   )}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>
        </TabsContent>



        {/* Edit Transaction Dialog */}
        <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Transaction</DialogTitle>
                </DialogHeader>
                {editingTransaction && (
                    <form key={editingTransaction.id} onSubmit={handleUpdateTransaction} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Type</Label>
                            <Select 
                                defaultValue={editingTransaction.type} 
                                onValueChange={(val: any) => setEditingTransaction({...editingTransaction, type: val})}
                            >
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="expense">Expense</SelectItem>
                                    <SelectItem value="income">Income</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Amount</Label>
                            <Input 
                                type="number" 
                                className="col-span-3" 
                                defaultValue={editingTransaction.amount} 
                                onChange={e => setEditingTransaction({...editingTransaction, amount: Number(e.target.value)})}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Account</Label>
                            <Select 
                                defaultValue={editingTransaction.accountId} 
                                onValueChange={(val: any) => setEditingTransaction({...editingTransaction, accountId: val})}
                            >
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>{acc.name} (${acc.balance})</SelectItem>
                                    ))}
                                    {accounts.length === 0 && <SelectItem value="default">Default Account</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Description</Label>
                            <Input 
                                className="col-span-3" 
                                defaultValue={editingTransaction.description} 
                                onChange={e => setEditingTransaction({...editingTransaction, description: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Category</Label>
                            <Input 
                                className="col-span-3" 
                                defaultValue={editingTransaction.category} 
                                onChange={e => setEditingTransaction({...editingTransaction, category: e.target.value})}
                                list="category-suggestions"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Date</Label>
                            <Input 
                                type="date" 
                                className="col-span-3" 
                                defaultValue={editingTransaction.date.split('T')[0]} 
                                onChange={e => setEditingTransaction({...editingTransaction, date: e.target.value})}
                            />
                        </div>
                        <Button type="submit">Update Transaction</Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>

        {/* Edit Income Dialog */}
        <Dialog open={isEditIncomeOpen} onOpenChange={setIsEditIncomeOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Income Stream</DialogTitle></DialogHeader>
                {editingIncome && (
                    <form key={editingIncome.id} onSubmit={handleUpdateIncome} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Name</Label>
                            <Input 
                                className="col-span-3" 
                                defaultValue={editingIncome.name} 
                                onChange={e => setEditingIncome({...editingIncome, name: e.target.value})}
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Amount</Label>
                            <Input 
                                type="number" 
                                className="col-span-3" 
                                defaultValue={editingIncome.amount} 
                                onChange={e => setEditingIncome({...editingIncome, amount: Number(e.target.value)})}
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Account</Label>
                            <Select 
                                defaultValue={editingIncome.accountId}
                                onValueChange={(val) => setEditingIncome({...editingIncome, accountId: val})}
                            >
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Account" /></SelectTrigger>
                                <SelectContent>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>{acc.name} (${acc.balance})</SelectItem>
                                    ))}
                                    {accounts.length === 0 && <SelectItem value="default">Default Account</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Frequency</Label>
                            <Select 
                                defaultValue={editingIncome.frequency} 
                                onValueChange={(val: any) => setEditingIncome({...editingIncome, frequency: val})}
                            >
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Next Payday</Label>
                            <Input 
                                type="date" 
                                className="col-span-3" 
                                defaultValue={editingIncome.nextDueDate ? new Date(editingIncome.nextDueDate).toISOString().split('T')[0] : ''} 
                                onChange={e => setEditingIncome({...editingIncome, nextDueDate: e.target.value})}
                                required 
                            />
                        </div>
                        <Button type="submit">Update Income</Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>

        {/* Edit Budget Dialog */}
        <Dialog open={isEditBudgetOpen} onOpenChange={setIsEditBudgetOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Budget</DialogTitle></DialogHeader>
                {editingBudget && (
                    <form key={editingBudget.id} onSubmit={handleUpdateBudget} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Category</Label>
                            <Input 
                                className="col-span-3" 
                                defaultValue={editingBudget.category} 
                                onChange={e => setEditingBudget({...editingBudget, category: e.target.value})}
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Limit ($)</Label>
                            <Input 
                                type="number" 
                                className="col-span-3" 
                                defaultValue={editingBudget.amount} 
                                onChange={e => setEditingBudget({...editingBudget, amount: Number(e.target.value)})}
                                required 
                            />
                        </div>
                        <Button type="submit">Update Budget</Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>

        {/* Edit Goal Dialog */}
        <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Savings Goal</DialogTitle></DialogHeader>
                {editingGoal && (
                    <form key={editingGoal.id} onSubmit={handleUpdateGoal} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Goal Name</Label>
                            <Input 
                                className="col-span-3" 
                                defaultValue={editingGoal.name} 
                                onChange={e => setEditingGoal({...editingGoal, name: e.target.value})}
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Target Amount</Label>
                            <Input 
                                type="number" 
                                className="col-span-3" 
                                defaultValue={editingGoal.targetAmount} 
                                onChange={e => setEditingGoal({...editingGoal, targetAmount: Number(e.target.value)})}
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Current Amount</Label>
                            <Input 
                                type="number" 
                                className="col-span-3" 
                                defaultValue={editingGoal.currentAmount} 
                                onChange={e => setEditingGoal({...editingGoal, currentAmount: Number(e.target.value)})}
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Deadline</Label>
                            <Input 
                                type="date" 
                                className="col-span-3" 
                                defaultValue={editingGoal.deadline ? new Date(editingGoal.deadline).toISOString().split('T')[0] : ''} 
                                onChange={e => setEditingGoal({...editingGoal, deadline: e.target.value})}
                            />
                        </div>
                        <Button type="submit">Update Goal</Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>

        {/* Edit Debt Dialog */}
        <Dialog open={isEditDebtOpen} onOpenChange={setIsEditDebtOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Debt</DialogTitle></DialogHeader>
                {editingDebt && (
                    <form key={editingDebt.id} onSubmit={handleUpdateDebt} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Debt Name</Label>
                            <Input 
                                className="col-span-3" 
                                defaultValue={editingDebt.name} 
                                onChange={e => setEditingDebt({...editingDebt, name: e.target.value})}
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Linked Account</Label>
                            <Select 
                                defaultValue={editingDebt.accountId || 'none'}
                                onValueChange={(val) => setEditingDebt({...editingDebt, accountId: val === 'none' ? undefined : val})}
                            >
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Optional Link" /></SelectTrigger>
                                <SelectContent>
                                    {accounts.filter(a => a.type === 'credit' || a.type === 'loan').map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                    ))}
                                    <SelectItem value="none">None</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Balance</Label>
                            <Input 
                                type="number" 
                                className="col-span-3" 
                                defaultValue={editingDebt.balance} 
                                onChange={e => setEditingDebt({...editingDebt, balance: Number(e.target.value)})}
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Interest Rate %</Label>
                            <Input 
                                type="number" 
                                step="0.1" 
                                className="col-span-3" 
                                defaultValue={editingDebt.interestRate} 
                                onChange={e => setEditingDebt({...editingDebt, interestRate: Number(e.target.value)})}
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Min Payment</Label>
                            <Input 
                                type="number" 
                                className="col-span-3" 
                                defaultValue={editingDebt.minimumPayment} 
                                onChange={e => setEditingDebt({...editingDebt, minimumPayment: Number(e.target.value)})}
                                required 
                            />
                        </div>
                        <Button type="submit">Update Debt</Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>

      </Tabs>
    </div>
  );
}
