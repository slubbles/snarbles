'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Search, Target, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface SEOAuditData {
  timestamp: string
  domain: string
  status: string
  pages: Record<string, {
    title: string
    metaDescription: string
    keywords: string[]
    score?: number
  }>
  competitive: {
    keywordOpportunities: Array<{
      keyword: string
      volume: number
      difficulty: string
      action: string
    }>
  }
  recommendations: Array<{
    priority: string
    category: string
    action: string
    impact: string
  }>
  actionItems: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
}

export default function SEODashboard() {
  const [seoData, setSeoData] = useState<SEOAuditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    fetchSEOData()
  }, [])

  const fetchSEOData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/seo-audit')
      const data = await response.json()
      setSeoData(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch SEO data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'default'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'default'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!seoData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Failed to load SEO data</p>
            <div className="text-center mt-4">
              <Button onClick={fetchSEOData}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const overallScore = Object.values(seoData.pages).reduce((acc, page) => acc + (page.score || 90), 0) / Object.keys(seoData.pages).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and optimize SEO performance for {seoData.domain}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button onClick={fetchSEOData} variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall SEO Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(overallScore)}/100</div>
            <Progress value={overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages Optimized</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(seoData.pages).length}</div>
            <p className="text-xs text-muted-foreground">All pages have metadata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keyword Opportunities</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seoData.competitive.keywordOpportunities.length}</div>
            <p className="text-xs text-muted-foreground">High-potential targets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Items</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seoData.actionItems.immediate.length}</div>
            <p className="text-xs text-muted-foreground">Immediate priority</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">Page Analysis</TabsTrigger>
          <TabsTrigger value="keywords">Keyword Opportunities</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(seoData.pages).map(([pageKey, page]) => (
              <Card key={pageKey}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{pageKey} Page</CardTitle>
                    <Badge variant="outline">{page.score || 90}/100</Badge>
                  </div>
                  <CardDescription>{page.title}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Meta Description</h4>
                    <p className="text-sm text-muted-foreground">{page.metaDescription}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {page.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <div className="grid gap-4">
            {seoData.competitive.keywordOpportunities.map((opportunity, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{opportunity.keyword}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={getDifficultyColor(opportunity.difficulty)}>
                        {opportunity.difficulty}
                      </Badge>
                      <Badge variant="outline">{opportunity.volume.toLocaleString()} searches/mo</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{opportunity.action}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {seoData.recommendations.map((rec, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rec.action}</CardTitle>
                    <Badge variant={getPriorityColor(rec.priority)}>
                      {rec.priority} Priority
                    </Badge>
                  </div>
                  <CardDescription className="capitalize">{rec.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{rec.impact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Immediate Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {seoData.actionItems.immediate.map((item, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Short Term (1-3 months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {seoData.actionItems.shortTerm.map((item, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Long Term (3+ months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {seoData.actionItems.longTerm.map((item, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
