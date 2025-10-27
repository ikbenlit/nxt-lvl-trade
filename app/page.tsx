/**
 * Home Page - Landing / Dashboard
 *
 * Temporary landing page with quick access to Chat interface.
 * Will be replaced with full Dashboard in Fase 4.1.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calculator, BookOpen } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <h1 className="text-2xl font-bold">Trade Level Up</h1>
          <p className="text-sm text-muted-foreground">
            AI Trading Decision Support Bot
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-7xl px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            MVP v0.1 - Fase 3.4 Complete
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Your AI Trading Sparring Partner
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Objective setup analysis, confluence scoring, and position sizing
            for SOL-PERP and BTC-PERP swing trading on Drift Protocol.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Chat Interface */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <MessageSquare className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Chat with Claude</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask Claude about trading setups, get confluence analysis,
                  and receive objective entry/stop/target suggestions.
                </p>
              </div>
              <div className="mt-auto">
                <Button asChild className="w-full">
                  <Link href="/chat">Open Chat Interface</Link>
                </Button>
              </div>
            </div>
          </Card>

          {/* Position Calculator */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <Calculator className="h-12 w-12 text-green-600 dark:text-green-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Position Calculator</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Calculate position size based on 1% risk, R:R ratio,
                  liquidation safety, and get level suggestions.
                </p>
              </div>
              <div className="mt-auto">
                <Button asChild className="w-full">
                  <Link href="/calculator">Open Calculator</Link>
                </Button>
              </div>
            </div>
          </Card>

          {/* Trade Log */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <BookOpen className="h-12 w-12 text-purple-600 dark:text-purple-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Trade Log</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  View all trades, filter by asset/status, sort by any column,
                  and see detailed trade information.
                </p>
              </div>
              <div className="mt-auto">
                <Button asChild className="w-full">
                  <Link href="/log">View Trade Log</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Status Section */}
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-semibold mb-3">Development Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">✓</Badge>
              <span>Fase 0: Project Setup (Next.js, Database, Dependencies)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">✓</Badge>
              <span>Fase 1: Core Services (Drift SDK, Binance Candles, Strategy Engine, Claude)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">✓</Badge>
              <span>Fase 2: Chat Interface (SSE Streaming, Function Calling, Thread Resume)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">✓</Badge>
              <span>Fase 3.1-3.4: Position Calculator + Trade Log UI (Multiple targets, Claude suggestions, Trade table)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">⏳</Badge>
              <span>Fase 3.5-3.7: Trade CRUD actions, Claude Evaluation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">⏸️</Badge>
              <span>Fase 4-5: Dashboard Integration, Testing & Deployment</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>MVP Progress:</strong> ~75% complete (11/12 subfases)
            </p>
          </div>
        </Card>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">Documentation:</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/docs/Bouwplan_v2.0.md" target="_blank">
                Bouwplan
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/docs/FO_AI_Trading_Bot_v2.0.md" target="_blank">
                Functioneel Ontwerp
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/docs/Screen_Specifications_v2.0.md" target="_blank">
                Screen Specs
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto max-w-7xl px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Built with Next.js 16, TypeScript, Tailwind CSS, shadcn/ui</p>
          <p className="mt-1">Powered by Anthropic Claude, Drift Protocol, Binance Futures API</p>
        </div>
      </footer>
    </div>
  );
}
