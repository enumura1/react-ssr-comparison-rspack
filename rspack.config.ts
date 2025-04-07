import { Configuration } from '@rspack/cli';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: Configuration = {
  context: __dirname,
  entry: {
    main: './src/main.tsx',
    'client-entry': './src/client-entry.tsx'
  },
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            sourceMap: true,
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true
              },
              transform: {
                react: {
                  runtime: 'automatic'
                }
              }
            }
          }
        },
        type: 'javascript/auto'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.svg$/,
        type: 'asset'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};

export default config;
