import path from 'path';
import webpack from 'webpack';

const config: webpack.Configuration = {
  entry: {
    'mindar-image': './src/image-target/index.ts',
    'mindar-image-aframe': './src/image-target/aframe.ts',
    'mindar-image-three': './src/image-target/three.ts',
    'mindar-face': './src/face-target/index.ts',
    'mindar-face-aframe': './src/face-target/aframe.ts',
    'mindar-face-three': './src/face-target/three.ts',
  },
  mode: 'production',
  output: {
    filename: '[name].prod.js',
    path: path.resolve(__dirname, 'out'),
    publicPath: '',
  },
  module: {
    rules: [
      {
        test: /\.worker\.ts$/,
        loader: 'worker-loader',
        options: {
          inline: 'no-fallback',
        },
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.html$/,
        use: 'html-loader',
      },
    ],
  },
  stats: {
    children: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      fs: false,
      path: false,
      crypto: false,
    },
  },
};

export default config;