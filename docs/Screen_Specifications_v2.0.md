# 📱 Screen Specifications – AI Trading Decision Support Bot

**Projectnaam:** AI Trading Decision Support Bot
**Versie:** v2.0
**Datum:** 26-10-2025
**Auteur:** Colin

---

## 1. Doel van dit Document

Dit document is een **beknopte aanvulling** op het Functioneel Ontwerp (FO). Het specificeert:
- Exacte component gebruik (shadcn/ui)
- Layout grids en spacing
- States per scherm (loading, error, empty)
- Responsive behavior
- Component library specificaties

---

## 2. Design System

### 2.1 Component Library (shadcn/ui)

**Gebruikte Components:**

| Component | Gebruik | Import |
|-----------|---------|--------|
| **Button** | Primary actions, secondary buttons | `@/components/ui/button` |
| **Input** | Text fields (entry price, stop loss) | `@/components/ui/input` |
| **Textarea** | Chat input, reasoning fields | `@/components/ui/textarea` |
| **Card** | Container voor content blocks | `@/components/ui/card` |
| **Dialog** | Modals (trade detail, confirmations) | `@/components/ui/dialog` |
| **DropdownMenu** | User menu, asset selector | `@/components/ui/dropdown-menu` |
| **Select** | Filters (asset, status) | `@/components/ui/select` |
| **Table** | Trade log table | `@/components/ui/table` |
| **Tabs** | Dashboard tabs (Phase 2) | `@/components/ui/tabs` |
| **Badge** | Status indicators (open/closed) | `@/components/ui/badge` |
| **ScrollArea** | Chat messages, long content | `@/components/ui/scroll-area` |
| **Skeleton** | Loading states | `@/components/ui/skeleton` |
| **Toast** | Notifications | `sonner` library |

**Component Variants:**

```typescript
// Button variants
<Button variant="default">Primary Action</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="destructive">Delete Trade</Button>

// Badge variants
<Badge variant="default">Open</Badge>
<Badge variant="success">Closed +6.3%</Badge>
<Badge variant="destructive">Closed -2.1%</Badge>
<Badge variant="outline">Medium Conviction</Badge>
```

### 2.2 Typography Scale

```typescript
// tailwind.config.ts
theme: {
  extend: {
    fontSize: {
      'xs': '0.75rem',     // 12px - timestamps, captions
      'sm': '0.875rem',    // 14px - body text
      'base': '1rem',      // 16px - default
      'lg': '1.125rem',    // 18px - card titles
      'xl': '1.25rem',     // 20px - page titles
      '2xl': '1.5rem',     // 24px - section headers
    }
  }
}
```

### 2.3 Color Palette

```typescript
// tailwind.config.ts (shadcn/ui default + custom)
colors: {
  // Trading-specific colors
  profit: 'hsl(142 76% 36%)',      // Green #16a34a
  loss: 'hsl(0 84% 60%)',          // Red #ef4444
  neutral: 'hsl(240 5% 64%)',      // Gray

  // Confluence colors
  high: 'hsl(142 76% 36%)',        // 5-6 factors
  medium: 'hsl(45 93% 47%)',       // 4 factors
  low: 'hsl(0 84% 60%)',           // 0-3 factors
}
```

### 2.4 Spacing System

```typescript
// Consistent spacing (Tailwind defaults)
gap-2    // 0.5rem (8px)  - tight spacing
gap-4    // 1rem (16px)   - default spacing
gap-6    // 1.5rem (24px) - section spacing
gap-8    // 2rem (32px)   - large spacing

p-4      // Padding small (cards, buttons)
p-6      // Padding medium (containers)
p-8      // Padding large (page padding)
```

### 2.5 Responsive Breakpoints

```typescript
// Tailwind defaults
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop

// Usage:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## 3. Screen Specifications

### 3.1 Global Layout

**Container:**
```tsx
<div className="min-h-screen bg-background">
  <Header />
  <main className="container mx-auto max-w-7xl px-4 py-6">
    {children}
  </main>
</div>
```

**Header (Persistent):**
```tsx
<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
  <div className="container flex h-16 items-center justify-between">
    <div className="flex items-center gap-8">
      <h1 className="text-xl font-bold">Trade Level Up</h1>
      <nav className="hidden md:flex gap-4">
        <Button variant="ghost">Dashboard</Button>
        <Button variant="ghost">Chat</Button>
        <Button variant="ghost">Calculator</Button>
        <Button variant="ghost">Log</Button>
      </nav>
    </div>
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon">☀️</Button> {/* Theme toggle */}
      <DropdownMenu>{/* User menu */}</DropdownMenu>
    </div>
  </div>
</header>
```

---

### 3.2 Dashboard (`/`)

**Layout:**
```tsx
<div className="space-y-6">
  {/* Quick Scan Card */}
  <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">Quick Scan</h2>
      <Select>{/* Asset selector */}</Select>
    </div>

    {/* Stats Bar */}
    <div className="grid grid-cols-3 gap-4 mb-4">
      <StatCard label="Price" value="$138.20" change="-3.2%" />
      <StatCard label="RSI (4h)" value="34" status="oversold" />
      <StatCard label="Funding" value="-0.015%" status="negative" />
    </div>

    {/* Action Buttons */}
    <div className="flex gap-2">
      <Button className="flex-1">Analyze with Claude</Button>
      <Button variant="outline" className="flex-1">Calculate Position</Button>
    </div>
  </Card>

  {/* Recent Activity */}
  <Card className="p-6">
    <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
    <ScrollArea className="h-[300px]">
      <ActivityList />
    </ScrollArea>
  </Card>
</div>
```

**Components:**
- `Card` - Container
- `Select` - Asset dropdown
- `Button` - Primary/outline variants
- `ScrollArea` - Activity list

**States:**
- **Loading:** `<Skeleton className="h-32" />` voor Quick Scan
- **Error:** Toast notification + retry button
- **Empty:** "No recent activity. Start analyzing setups!"

**Responsive:**
```tsx
// Mobile: Stack vertically
<div className="space-y-4">

// Desktop: 2-column grid
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

---

### 3.3 Chat Interface (`/chat`)

**Layout:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 h-[calc(100vh-200px)]">
  {/* Main Chat Area */}
  <Card className="flex flex-col">
    <ScrollArea className="flex-1 p-6">
      <MessageList messages={messages} />
    </ScrollArea>

    <div className="border-t p-4">
      <form onSubmit={handleSend} className="flex gap-2">
        <Textarea
          placeholder="Ask about SOL-PERP or BTC-PERP setups..."
          className="min-h-[60px] max-h-[200px] resize-none"
          maxLength={500}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Spinner /> : 'Send'}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-1">
        {charCount}/500
      </p>
    </div>
  </Card>

  {/* Context Sidebar (collapsible on mobile) */}
  <Card className="p-6 hidden lg:block">
    <h3 className="font-semibold mb-4">Context</h3>
    <ConfluenceDisplay score={5} factors={...} />
  </Card>
</div>
```

**Message Bubble:**
```tsx
<div className={cn(
  'flex mb-4',
  isUser ? 'justify-end' : 'justify-start'
)}>
  <div className={cn(
    'max-w-[80%] rounded-2xl px-4 py-3',
    isUser
      ? 'bg-blue-600 text-white rounded-tr-none'
      : 'bg-muted rounded-tl-none'
  )}>
    <p className="text-sm whitespace-pre-wrap">{content}</p>

    {/* Confluence Display (Claude messages only) */}
    {confluenceData && <ConfluenceDisplay {...confluenceData} />}

    {/* Action Buttons */}
    {hasActions && (
      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="outline">Calculate Position</Button>
        <Button size="sm" variant="outline">Set Alert</Button>
      </div>
    )}

    <p className="text-xs opacity-70 mt-2">{timestamp}</p>
  </div>
</div>
```

**States:**
- **Streaming:** Blinking cursor `<span className="animate-pulse">|</span>`
- **Tool Use:** Badge "Fetching data..." with `<Loader2 className="animate-spin" />`
- **Error:** Red border on message + retry button

**Responsive:**
```tsx
// Mobile: Hide sidebar, show as drawer
<Sheet>
  <SheetTrigger>Context</SheetTrigger>
  <SheetContent><ConfluenceDisplay /></SheetContent>
</Sheet>
```

---

### 3.4 Position Calculator (`/calculator`)

**Layout:**
```tsx
<Card className="max-w-3xl mx-auto p-6">
  <h1 className="text-2xl font-bold mb-6">Position Calculator</h1>

  {/* Asset Selection */}
  <div className="mb-6">
    <Label>Asset</Label>
    <div className="flex gap-2 mt-2">
      <Button variant={asset === 'SOL-PERP' ? 'default' : 'outline'}>
        SOL-PERP
      </Button>
      <Button variant={asset === 'BTC-PERP' ? 'default' : 'outline'}>
        BTC-PERP
      </Button>
    </div>
  </div>

  {/* Account Settings */}
  <div className="grid grid-cols-2 gap-4 mb-6">
    <div>
      <Label>Account Size</Label>
      <Input type="number" value={accountSize} />
    </div>
    <div>
      <Label>Risk per Trade</Label>
      <Input type="number" value={riskPct} suffix="%" />
      <p className="text-sm text-muted-foreground mt-1">
        = ${riskAmount}
      </p>
    </div>
  </div>

  {/* Price Levels */}
  <div className="space-y-4 mb-6">
    <div>
      <Label>Entry Price</Label>
      <Input type="number" value={entry} />
      <p className="text-xs text-muted-foreground">
        Current: ${currentPrice}
      </p>
    </div>
    <div>
      <Label>Stop Loss</Label>
      <Input type="number" value={stop} />
      <p className="text-xs text-muted-foreground">
        {stopDistancePct}% from entry
      </p>
    </div>
    <div>
      <Label>Target 1</Label>
      <Input type="number" value={target1} />
      <p className="text-xs text-muted-foreground">
        {targetDistancePct}% from entry
      </p>
    </div>

    <Button variant="outline" onClick={suggestLevels}>
      Suggest Levels (Claude)
    </Button>
  </div>

  {/* Risk/Reward Display */}
  <Card className="p-4 bg-muted mb-6">
    <h3 className="font-semibold mb-3">Risk/Reward Analysis</h3>

    {/* Visual bars */}
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-20 text-sm">Risk:</div>
        <div className="flex-1 h-2 bg-red-500 rounded" style={{width: '20%'}} />
        <div className="text-sm font-mono">${riskAmount}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-20 text-sm">Reward:</div>
        <div className="flex-1 h-2 bg-green-500 rounded" style={{width: '70%'}} />
        <div className="text-sm font-mono">${rewardAmount}</div>
      </div>
    </div>

    {/* R:R Ratio */}
    <div className="mt-4 flex items-center justify-between">
      <span className="font-semibold">R:R Ratio:</span>
      <Badge variant={rrRatio >= 1.5 ? 'success' : 'destructive'}>
        {rrRatio}:1 {rrRatio >= 1.5 ? '✅' : '❌'}
      </Badge>
    </div>
  </Card>

  {/* Position Size Result */}
  <Card className="p-4 bg-blue-50 dark:bg-blue-950 mb-6">
    <h3 className="font-semibold mb-3">Position Sizing</h3>

    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>Position Size:</span>
        <span className="font-bold text-lg">{positionSize} SOL</span>
      </div>
      <div className="flex justify-between">
        <span>Notional Value:</span>
        <span className="font-mono">${notionalValue.toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span>Margin Required (10x):</span>
        <span className="font-mono">${marginRequired.toLocaleString()}</span>
      </div>
      <div className="flex justify-between border-t pt-2 mt-2">
        <span>Liquidation Price:</span>
        <span className="font-mono">${liqPrice}</span>
      </div>
      <div className="flex justify-between">
        <span>Liq Distance:</span>
        <Badge variant={liqDistancePct >= 8 ? 'success' : 'destructive'}>
          {liqDistancePct}% {liqDistancePct >= 8 ? '✅' : '⚠️'}
        </Badge>
      </div>
    </div>
  </Card>

  {/* Warnings */}
  {warnings.length > 0 && (
    <Card className="p-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 mb-6">
      <ul className="space-y-1 text-sm">
        {warnings.map(w => <li key={w}>⚠️ {w}</li>)}
      </ul>
    </Card>
  )}

  {/* Actions */}
  <div className="flex gap-2">
    <Button className="flex-1" onClick={logTrade}>Log Trade</Button>
    <Button variant="outline" onClick={askClaude}>Ask Claude</Button>
    <Button variant="outline" onClick={copyToClipboard}>Copy</Button>
  </div>
</Card>
```

**Components:**
- `Card` - Main container + result boxes
- `Input` - Number inputs with validation
- `Button` - Multiple variants
- `Badge` - Status indicators (R:R, liq safety)
- `Label` - Form labels

**States:**
- **Calculating:** Spinner on "Suggest Levels" button
- **Error:** Inline error below invalid input (red text)
- **Valid:** Green checkmark next to valid R:R and liq distance

---

### 3.5 Trade Log (`/log`)

**Layout:**
```tsx
<div className="space-y-6">
  {/* Filters */}
  <Card className="p-4">
    <div className="flex gap-4 items-end">
      <div className="flex-1">
        <Label>Asset</Label>
        <Select value={assetFilter}>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="SOL-PERP">SOL-PERP</SelectItem>
          <SelectItem value="BTC-PERP">BTC-PERP</SelectItem>
        </Select>
      </div>
      <div className="flex-1">
        <Label>Status</Label>
        <Select value={statusFilter}>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </Select>
      </div>
      <Button>Apply</Button>
      <Button variant="outline">Clear</Button>
    </div>
  </Card>

  {/* Summary Stats */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">Total Trades</p>
      <p className="text-2xl font-bold">47</p>
    </Card>
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">Win Rate</p>
      <p className="text-2xl font-bold text-green-600">70%</p>
    </Card>
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">Avg R:R</p>
      <p className="text-2xl font-bold">2.1:1</p>
    </Card>
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">Total P&L</p>
      <p className="text-2xl font-bold text-green-600">+18.4%</p>
    </Card>
  </div>

  {/* Trade Table */}
  <Card>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead>Entry</TableHead>
          <TableHead>Exit</TableHead>
          <TableHead>P&L</TableHead>
          <TableHead>R:R</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map(trade => (
          <TableRow
            key={trade.id}
            onClick={() => openDetail(trade.id)}
            className="cursor-pointer hover:bg-muted"
          >
            <TableCell>{trade.id}</TableCell>
            <TableCell>{trade.asset}</TableCell>
            <TableCell>${trade.entry_price}</TableCell>
            <TableCell>{trade.exit_price ? `$${trade.exit_price}` : '-'}</TableCell>
            <TableCell className={trade.pnl_pct > 0 ? 'text-green-600' : 'text-red-600'}>
              {trade.pnl_pct > 0 ? '+' : ''}{trade.pnl_pct}%
            </TableCell>
            <TableCell>{trade.r_multiple}:1</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant={trade.status === 'open' ? 'default' : 'secondary'}>
                  {trade.status}
                </Badge>
                {trade.claude_evaluation && '📝'}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>

  {/* Pagination */}
  <div className="flex justify-center gap-2">
    <Button variant="outline" disabled={page === 1}>Previous</Button>
    <span className="flex items-center px-4">Page {page} of {totalPages}</span>
    <Button variant="outline" disabled={page === totalPages}>Next</Button>
  </div>
</div>
```

**Components:**
- `Table` - Main data table
- `Select` - Filters
- `Card` - Stats cards + table container
- `Badge` - Status indicators

**States:**
- **Loading:** Skeleton rows (3-5 placeholders)
- **Empty:** "No trades yet. Start by analyzing a setup!"
- **Error:** Toast + retry button

**Trade Detail Modal:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Trade #{trade.id} Detail</DialogTitle>
    </DialogHeader>

    <div className="space-y-6">
      {/* Setup Details */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Setup Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Asset:</div><div className="font-mono">{trade.asset}</div>
          <div>Entry:</div><div className="font-mono">${trade.entry_price}</div>
          <div>Exit:</div><div className="font-mono">${trade.exit_price}</div>
          <div>P&L:</div>
          <div className={cn(
            'font-bold',
            trade.pnl_pct > 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {trade.pnl_pct > 0 ? '+' : ''}{trade.pnl_pct}% (${trade.pnl_usd})
          </div>
        </div>
      </Card>

      {/* Your Reasoning */}
      <div>
        <h3 className="font-semibold mb-2">Your Reasoning</h3>
        <Card className="p-4 bg-muted">
          <p className="text-sm whitespace-pre-wrap">{trade.user_reasoning}</p>
        </Card>
      </div>

      {/* Emotional Notes */}
      <div>
        <h3 className="font-semibold mb-2">Emotional Notes</h3>
        <Card className="p-4 bg-muted">
          <p className="text-sm whitespace-pre-wrap">{trade.emotional_notes}</p>
        </Card>
      </div>

      {/* Claude Evaluation (if exists) */}
      {trade.claude_evaluation ? (
        <div>
          <h3 className="font-semibold mb-2">Claude's Evaluation</h3>
          <Card className="p-4 bg-blue-50 dark:bg-blue-950">
            <p className="text-sm whitespace-pre-wrap">{trade.claude_evaluation}</p>
          </Card>
        </div>
      ) : (
        <Button onClick={evaluateTrade} className="w-full">
          Evaluate with Claude
        </Button>
      )}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={editNotes}>Edit Notes</Button>
      <Button variant="destructive" onClick={deleteTrade}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 4. Custom Components

### 4.1 ConfluenceDisplay

```tsx
// components/shared/ConfluenceDisplay.tsx
interface ConfluenceDisplayProps {
  score: number; // 0-6
  factors: {
    rsi_oversold_bought: boolean;
    support_resistance: boolean;
    oi_divergence: boolean;
    fvg_present: boolean;
    order_block: boolean;
    funding_extreme: boolean;
  };
  showDetails?: boolean;
}

export function ConfluenceDisplay({ score, factors, showDetails = true }: ConfluenceDisplayProps) {
  const getColor = (score: number) => {
    if (score >= 5) return 'text-green-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stars = '⭐'.repeat(score);

  return (
    <div className="space-y-3">
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Confluence Score</span>
        <div className="flex items-center gap-2">
          <span className={cn('text-xl font-bold', getColor(score))}>
            {score}/6
          </span>
          <span>{stars}</span>
        </div>
      </div>

      {/* Factor Checklist */}
      {showDetails && (
        <div className="space-y-1 text-sm">
          <FactorItem checked={factors.rsi_oversold_bought} label="RSI oversold/overbought" />
          <FactorItem checked={factors.support_resistance} label="Near support/resistance" />
          <FactorItem checked={factors.oi_divergence} label="OI divergence" />
          <FactorItem checked={factors.fvg_present} label="Fair Value Gap" />
          <FactorItem checked={factors.order_block} label="Order Block" />
          <FactorItem checked={factors.funding_extreme} label="Extreme funding" />
        </div>
      )}
    </div>
  );
}

function FactorItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={checked ? 'text-green-600' : 'text-gray-400'}>
        {checked ? '✅' : '❌'}
      </span>
      <span className={checked ? '' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}
```

### 4.2 LoadingSkeleton

```tsx
// components/shared/LoadingSkeleton.tsx
export function MessageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-3/4" />
      <Skeleton className="h-20 w-2/3 ml-auto" />
      <Skeleton className="h-32 w-3/4" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card className="p-6">
      <Skeleton className="h-6 w-1/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </Card>
  );
}
```

### 4.3 ErrorBoundary

```tsx
// components/shared/ErrorBoundary.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ErrorDisplay({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card className="p-8 max-w-lg mx-auto mt-8 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <div className="flex gap-2 justify-center">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go Home
        </Button>
      </div>
    </Card>
  );
}
```

---

## 5. States & Animations

### 5.1 Loading States

```tsx
// Chat: Streaming text
<span className="animate-pulse">|</span>

// Buttons: Loading
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Send
</Button>

// Tool execution badge
<Badge>
  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
  Fetching data...
</Badge>
```

### 5.2 Error States

```tsx
// Inline error (form validation)
<div>
  <Input className={error ? 'border-red-500' : ''} />
  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
</div>

// Toast notification (global errors)
import { toast } from 'sonner';

toast.error('Failed to load trade data', {
  action: {
    label: 'Retry',
    onClick: () => refetch(),
  },
});
```

### 5.3 Empty States

```tsx
// Generic empty state
<div className="text-center py-12">
  <div className="text-6xl mb-4">📊</div>
  <h3 className="text-lg font-semibold mb-2">No trades yet</h3>
  <p className="text-sm text-muted-foreground mb-4">
    Start by analyzing a setup in the Chat interface
  </p>
  <Button onClick={() => router.push('/chat')}>
    Analyze Setup
  </Button>
</div>
```

---

## 6. Responsive Patterns

### 6.1 Navigation

```tsx
// Desktop: Horizontal nav in header
<nav className="hidden md:flex gap-4">
  <Button variant="ghost">Dashboard</Button>
  <Button variant="ghost">Chat</Button>
  {/* ... */}
</nav>

// Mobile: Bottom tab bar
<nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background">
  <div className="flex justify-around p-2">
    <Button variant="ghost" size="sm">🏠</Button>
    <Button variant="ghost" size="sm">💬</Button>
    <Button variant="ghost" size="sm">🧮</Button>
    <Button variant="ghost" size="sm">📋</Button>
  </div>
</nav>
```

### 6.2 Grid Layouts

```tsx
// Auto-responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>

// Chat: Sidebar collapses to drawer on mobile
<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
  {/* Main content */}
  <div>{/* ... */}</div>

  {/* Sidebar: hidden on mobile, shown on desktop */}
  <aside className="hidden lg:block">{/* ... */}</aside>
</div>

{/* Mobile: Drawer */}
<Sheet>
  <SheetTrigger className="lg:hidden">Context</SheetTrigger>
  <SheetContent>{/* Sidebar content */}</SheetContent>
</Sheet>
```

### 6.3 Tables

```tsx
// Desktop: Full table
<Table className="hidden md:table">
  {/* Full table content */}
</Table>

// Mobile: Card-based list
<div className="md:hidden space-y-2">
  {trades.map(trade => (
    <Card key={trade.id} className="p-4">
      <div className="flex justify-between mb-2">
        <span className="font-semibold">{trade.asset}</span>
        <Badge variant={trade.pnl_pct > 0 ? 'success' : 'destructive'}>
          {trade.pnl_pct}%
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground">
        Entry: ${trade.entry_price} → Exit: ${trade.exit_price}
      </div>
    </Card>
  ))}
</div>
```

---

## 7. Keyboard Shortcuts

```tsx
// Chat: Enter to send, Shift+Enter for newline
<Textarea
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }}
/>

// Modal: Esc to close (handled by shadcn Dialog)
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  {/* Auto-handles Esc key */}
</Dialog>

// Global shortcuts (optional Phase 2)
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      // Open command palette
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## 8. Dark Mode

```tsx
// Implemented via next-themes
// All shadcn/ui components support dark mode by default

// Theme toggle button
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  );
}
```

**Color Adjustments:**
```tsx
// Light mode: bg-gray-100
// Dark mode: dark:bg-gray-800

// Component automatically adapts
<Card className="bg-muted">
  {/* muted = gray-100 (light) or gray-800 (dark) */}
</Card>
```

---

## 9. Accessibility (WCAG AA)

**Minimum Requirements:**

1. **Color Contrast:** 4.5:1 for text, 3:1 for UI components
   - Tested with Tailwind's default palette (compliant)

2. **Keyboard Navigation:** All interactive elements accessible via Tab
   - shadcn/ui components have built-in keyboard support

3. **Screen Reader Labels:**
```tsx
// Buttons with icons only
<Button variant="ghost" size="icon" aria-label="Toggle theme">
  ☀️
</Button>

// Form inputs
<Label htmlFor="entry-price">Entry Price</Label>
<Input id="entry-price" aria-describedby="entry-helper" />
<p id="entry-helper" className="text-xs">Current price: $138.20</p>
```

4. **Focus Indicators:** Built-in via Tailwind's `focus-visible:ring-2`

---

## 10. Implementation Checklist

**Per Screen:**
- [ ] Layout structure matches spec
- [ ] All components from shadcn/ui used correctly
- [ ] Loading states implemented (Skeleton)
- [ ] Error states handled (Toast + inline)
- [ ] Empty states designed
- [ ] Responsive breakpoints working (mobile/tablet/desktop)
- [ ] Dark mode support verified
- [ ] Keyboard shortcuts functional
- [ ] Accessibility labels added

**Global:**
- [ ] Component library installed (`npx shadcn-ui@latest init`)
- [ ] Theme provider configured (next-themes)
- [ ] Toast provider added (sonner)
- [ ] Error boundaries implemented
- [ ] Loading skeletons created for all async content

---

**Einde Screen Specifications v2.0**

*Dit document is een beknopte aanvulling op het Functioneel Ontwerp (FO) en specificeert exact welke components, states en layouts gebruikt worden. Voor complete user flows, zie het FO. Voor technische implementatie, zie het TO.*
