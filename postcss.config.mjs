// Configuration PostCSS pour les modules ES
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import postcssNesting from 'postcss-nesting';
import postcssImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  plugins: [
    postcssImport(),
    postcssNesting(),
    tailwindcss(),
    autoprefixer(),
    postcssPresetEnv({
      stage: 1,
      features: {
        'nesting-rules': true,
      },
    }),
    ...(isProduction ? [cssnano({ preset: 'default' })] : []),
  ],
};
