# AI Chat Widget

A customizable AI-powered chat widget that can be easily integrated into any website. Built with React, Vite, and powered by Google's Gemini AI.

## Features

- 🤖 AI-powered responses using Google's Gemini
- 🎨 Customizable appearance
- 💾 Persistent settings with Supabase
- 🔒 Secure authentication
- 📱 Responsive design
- ⚡ Fast and lightweight

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run format` - Format code
- `npm test` - Run tests

## Production Deployment

1. Set up environment variables in your hosting platform
2. Deploy using the build command: `npm run build`
3. Serve the `dist` directory

## Environment Variables

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `GEMINI_API_KEY` - Google Gemini API key

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this in your projects!