// Enhanced PDF generation utility for tokenomics reports
import { jsPDF } from 'jspdf';

export interface TokenomicsData {
  projectName: string;
  projectDescription: string;
  totalSupply: number;
  distribution: Record<string, { label: string; value: number; color: string }>;
  healthAnalysis: {
    score: number;
    strengths: string[];
    issues: string[];
    recommendations: string[];
  };
}

export class TokenomicsPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 15;
  private currentY = 20;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
  }

  private get contentWidth() {
    return this.pageWidth - (this.margin * 2);
  }

  private addNewPageIfNeeded(spaceNeeded: number): void {
    if (this.currentY + spaceNeeded > this.pageHeight - 25) {
      this.doc.addPage();
      this.currentY = 25;
    }
  }

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    this.doc.setFontSize(fontSize);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const width = this.doc.getTextWidth(testLine);
      
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  private addHeader(title: string, subtitle: string): void {
    // Header background
    this.doc.setFillColor(59, 130, 246);
    this.doc.rect(0, this.currentY - 5, this.pageWidth, 25, 'F');
    
    // Title
    this.doc.setFontSize(16);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.pageWidth / 2, this.currentY + 6, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(subtitle, this.pageWidth / 2, this.currentY + 14, { align: 'center' });
    
    this.currentY += 30;
  }

  private addCard(title: string, height: number = 40): number {
    this.addNewPageIfNeeded(height);
    
    // Card background
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, height, 'F');
    
    // Card border
    this.doc.setDrawColor(203, 213, 225);
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, height);
    
    // Title
    this.doc.setFontSize(11);
    this.doc.setTextColor(30, 41, 59);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 5, this.currentY + 8);
    
    const contentStartY = this.currentY + 12;
    this.currentY += height + 5;
    
    return contentStartY;
  }

  private addBulletPoint(text: string, color: [number, number, number] = [0, 0, 0]): void {
    const lines = this.wrapText(`• ${text}`, this.contentWidth - 20, 9);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(color[0], color[1], color[2]);
    
    lines.forEach((line, index) => {
      this.addNewPageIfNeeded(6);
      this.doc.text(line, this.margin + 10, this.currentY);
      this.currentY += 5;
    });
    this.currentY += 2;
  }

  private addTable(headers: string[], rows: string[][]): void {
    const columnCount = headers.length;
    const columnWidth = this.contentWidth / columnCount;
    const rowHeight = 8;
    
    this.addNewPageIfNeeded(rowHeight * (rows.length + 2));
    
    // Headers
    this.doc.setFillColor(241, 245, 249);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, rowHeight, 'F');
    this.doc.setDrawColor(203, 213, 225);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, rowHeight);
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(30, 41, 59);
    
    headers.forEach((header, index) => {
      this.doc.text(header, this.margin + 2 + (index * columnWidth), this.currentY + 6);
    });
    
    this.currentY += rowHeight;
    
    // Rows
    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(249, 250, 251);
        this.doc.rect(this.margin, this.currentY, this.contentWidth, rowHeight, 'F');
      }
      
      this.doc.setDrawColor(203, 213, 225);
      this.doc.rect(this.margin, this.currentY, this.contentWidth, rowHeight);
      
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      
      row.forEach((cell, cellIndex) => {
        this.doc.text(cell, this.margin + 2 + (cellIndex * columnWidth), this.currentY + 6);
      });
      
      this.currentY += rowHeight;
    });
    
    this.currentY += 5;
  }

  private addFooter(): void {
    const totalPages = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // Footer background
      this.doc.setFillColor(248, 250, 252);
      this.doc.rect(0, this.pageHeight - 20, this.pageWidth, 20, 'F');
      this.doc.setDrawColor(203, 213, 225);
      this.doc.line(0, this.pageHeight - 20, this.pageWidth, this.pageHeight - 20);
      
      // Footer text
      this.doc.setFontSize(7);
      this.doc.setTextColor(100, 116, 139);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Generated by Snarbles Tokenomics Designer', this.margin, this.pageHeight - 12);
      this.doc.text('Professional Token Economy Analysis • snarbles.xyz', this.margin, this.pageHeight - 6);
      this.doc.text(`Page ${i} of ${totalPages}`, this.pageWidth - this.margin, this.pageHeight - 12, { align: 'right' });
      this.doc.text(new Date().toLocaleDateString(), this.pageWidth - this.margin, this.pageHeight - 6, { align: 'right' });
    }
  }

  public generateReport(data: TokenomicsData): jsPDF {
    // PAGE 1: COVER AND OVERVIEW
    this.addHeader(
      'TOKENOMICS ANALYSIS REPORT',
      `Professional Token Economy Assessment • ${new Date().toLocaleDateString()}`
    );

    // Project Overview
    const overviewContentY = this.addCard('PROJECT OVERVIEW', 50);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Project: ${data.projectName || 'Unnamed Token Project'}`, this.margin + 5, overviewContentY + 3);
    this.doc.text(`Total Supply: ${data.totalSupply.toLocaleString()} tokens`, this.margin + 5, overviewContentY + 12);
    this.doc.text(`Analysis Date: ${new Date().toLocaleDateString()}`, this.margin + 5, overviewContentY + 21);
    
    // Health Score Badge
    const healthColor = data.healthAnalysis.score >= 80 ? [34, 197, 94] : 
                       data.healthAnalysis.score >= 60 ? [251, 146, 60] : [239, 68, 68];
    
    this.doc.setFillColor(healthColor[0], healthColor[1], healthColor[2]);
    this.doc.roundedRect(this.margin + 100, overviewContentY, 35, 10, 2, 2, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Score: ${data.healthAnalysis.score}/100`, this.margin + 117, overviewContentY + 7, { align: 'center' });

    // Executive Summary
    const summaryContentY = this.addCard('EXECUTIVE SUMMARY', 40);
    const summary = `This analysis evaluates ${data.projectName || 'your token project'}'s economic structure with ${data.totalSupply.toLocaleString()} total tokens. ` +
                   `The project shows a health score of ${data.healthAnalysis.score}/100 based on distribution balance and sustainability factors.`;
    
    const summaryLines = this.wrapText(summary, this.contentWidth - 10, 9);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    summaryLines.forEach((line, index) => {
      this.doc.text(line, this.margin + 5, summaryContentY + 3 + (index * 5));
    });

    // PAGE 2: DISTRIBUTION ANALYSIS
    this.doc.addPage();
    this.currentY = 20;
    this.addHeader('TOKEN DISTRIBUTION BREAKDOWN', 'Detailed allocation analysis and metrics');

    // Distribution Table
    const distributionHeaders = ['Category', 'Allocation', 'Tokens', 'Purpose'];
    const distributionRows = Object.entries(data.distribution).map(([key, value]) => [
      value.label,
      `${value.value}%`,
      Math.round((data.totalSupply * value.value) / 100).toLocaleString(),
      key === 'team' ? 'Operations' : key === 'community' ? 'Rewards' : key === 'liquidity' ? 'Trading' : 'Growth'
    ]);

    this.addTable(distributionHeaders, distributionRows);

    // PAGE 3: HEALTH ANALYSIS
    this.doc.addPage();
    this.currentY = 20;
    this.addHeader('HEALTH ANALYSIS & RECOMMENDATIONS', 'Expert insights and strategic guidance');

    // Strengths
    if (data.healthAnalysis.strengths.length > 0) {
      this.addCard('STRENGTHS', Math.max(25, data.healthAnalysis.strengths.length * 8));
      data.healthAnalysis.strengths.forEach(strength => {
        this.addBulletPoint(strength, [34, 197, 94]);
      });
    }

    // Issues
    if (data.healthAnalysis.issues.length > 0) {
      this.addCard('AREAS FOR IMPROVEMENT', Math.max(25, data.healthAnalysis.issues.length * 8));
      data.healthAnalysis.issues.forEach(issue => {
        this.addBulletPoint(issue, [239, 68, 68]);
      });
    }

    // Recommendations
    if (data.healthAnalysis.recommendations.length > 0) {
      this.addCard('STRATEGIC RECOMMENDATIONS', Math.max(25, data.healthAnalysis.recommendations.length * 8));
      data.healthAnalysis.recommendations.forEach((rec, index) => {
        this.addBulletPoint(`${index + 1}. ${rec}`);
      });
    }

    this.addFooter();
    return this.doc;
  }

  public save(filename: string): void {
    this.doc.save(filename);
  }
}
