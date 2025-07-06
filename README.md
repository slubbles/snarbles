# 🚀 Snarbles Token Platform

A comprehensive, production-ready token creation platform built with Next.js, featuring mobile-optimized design and blockchain integration.

## 🚨 Current Status

### ✅ Algorand Network - Fully Operational
- **Token Creation**: ✅ Working perfectly
- **Dashboard**: ✅ Full analytics and management
- **Verification**: ✅ Complete token verification system
- **Tokenomics**: ✅ Advanced modeling tools

### ⚠️ Solana Network - Temporarily Unavailable  
- **Status**: Smart contract initialization issues
- **Issue**: `ProgramFailedToComplete` error during platform setup
- **Solution**: Contract debugging and redeployment needed
- **Alternative**: Use Algorand for immediate token creation

## ✨ Features

### 🎨 Token Creation
- **Intuitive Builder**: Create tokens in under 30 seconds
- **Multi-Chain Support**: Algorand (active) + Solana (pending fix)
- **Custom Features**: Mintable, burnable, and pausable options
- **Rich Metadata**: Add logos, descriptions, and social links
- **Real-time Preview**: See your token before deployment

### 📊 Analytics & Management
- **Comprehensive Dashboard**: Track token performance and holders
- **Advanced Analytics**: Charts, metrics, and transaction history
- **Token Management**: Transfer, mint, burn, and pause functionality
- **Portfolio Overview**: Manage multiple tokens from one interface

### 🧮 Tokenomics Tools
- **Interactive Simulator**: Design token distribution with visual tools
- **Export Reports**: Generate detailed tokenomics documentation
- **Recommendations**: Built-in best practices and suggestions
- **Flexible Configuration**: Customize allocation percentages

### 🔍 Verification System
- **Security Analysis**: Comprehensive token verification
- **Trust Indicators**: Security scores and verification badges
- **Contract Inspection**: Detailed smart contract analysis
- **Public Registry**: Browse verified tokens

### 📱 Mobile-First Design
- **Responsive Layout**: Optimized for all screen sizes
- **Touch-Friendly**: Proper touch targets and interactions
- **Fast Performance**: Optimized images and lazy loading
- **Accessible**: WCAG compliant design

### 🔗 Decentralized Architecture
- **Wallet-Based Identity**: No accounts, just connect your wallet
- **Direct Blockchain Integration**: All data comes from on-chain sources
- **Zero Central Dependencies**: Works without any centralized services
- **True Web3 Experience**: Complete decentralization

## 🎯 Quick Start Guide

### For Token Creation (Recommended):
1. **Visit**: [Create Page](/create)
2. **Connect**: Pera Wallet (Algorand)
3. **Choose**: Algorand Mainnet or Testnet
4. **Create**: Fill in token details and deploy
5. **Manage**: Use dashboard for analytics and operations

### For Solana Development:
1. **Check Status**: Visit [Admin Page](/admin) with admin wallet
2. **Run Diagnostics**: `node scripts/check-solana-program.js`
3. **Review Issues**: See `SOLANA_FIX_GUIDE.md` for details
4. **Deploy Fix**: Redeploy smart contract when ready

## 🛠️ Technology Stack

- **Framework**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI with shadcn/ui
- **Blockchain**: Solana Web3.js and Algorand integration
- **Charts**: Recharts for analytics visualization
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/snarbles-token-platform.git
   cd snarbles-token-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
snarbles-token-platform/
├── app/                    # Next.js app directory
│   ├── create/            # Token creation page
│   ├── dashboard/         # User dashboard
│   ├── tokenomics/        # Tokenomics simulator
│   ├── verify/            # Token verification
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   └── providers/        # Context providers
├── lib/                   # Utility functions
└── public/               # Static assets
```

## 🎨 Design System

### Color Palette
- **Primary**: Red (#EF4444) - Action and emphasis
- **Background**: Dynamic (Black/White) - Theme-based
- **Text**: High contrast for accessibility
- **Glass Effects**: Backdrop blur with transparency

### Typography
- **Font**: Inter with optimized weights
- **Scale**: Responsive typography system
- **Hierarchy**: Clear visual hierarchy

### Components
- **Glass Cards**: Translucent containers with blur effects
- **Enhanced Inputs**: Custom styled form controls
- **Gradient Buttons**: Eye-catching call-to-action buttons
- **Responsive Charts**: Mobile-optimized data visualization

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

### Deployment

#### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on every push
3. Configure environment variables in Vercel dashboard

#### Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `out`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Solana Foundation** for blockchain infrastructure
- **Algorand Foundation** for blockchain infrastructure
- **Vercel** for Next.js framework
- **Radix UI** for accessible components
- **Tailwind CSS** for utility-first styling

## 📞 Support

- **Documentation**: [Coming Soon]
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/snarbles-token-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/snarbles-token-platform/discussions)

---

**Built with ❤️ for the blockchain ecosystem**

*Empowering creators to launch their token ideas in minutes, not months.*