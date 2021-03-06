/* eslint-disable comma-dangle */
// ==========================================
// 1. DEPENDENCIES
// ==========================================
// gulp-dev-dependencies

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const gulp = require('gulp');
// check package.json for gulp plugins
const gulpLoadPlugins = require('gulp-load-plugins');

// dev-dependencies
const browserSync = require('browser-sync').create();
const del = require('del');
const fs = require('fs');
const rollup = require('rollup').rollup;
const rollupNodeResolve = require('rollup-plugin-node-resolve');
const rollupBabel = require('rollup-plugin-babel');
const rollupUglify = require('rollup-plugin-uglify');
const postcssAutoprefixer = require('autoprefixer');
const postcssCssnano = require('cssnano');

const pkg = require('./package.json');

const $ = gulpLoadPlugins();

const version = pkg.version;


const jsonNastaveni = JSON.parse(fs.readFileSync('./nastaveni.json'));


const ftpSettings = require('./ftp.json');
const ftp = require( 'vinyl-ftp' );
const changed = require('gulp-changed')



// ==========================================
// 2. FUNCTIONS
// ==========================================
function startBrowserSync() {
  if (browserSync.active) {
    return;
  }
  browserSync.init(config.browserSync);
}

// ==========================================
// CONFIG
// ==========================================
const config = {

  // COMMAND ARGUMENTS
  cmd: {
    // check if 'gulp --production'
    // http://stackoverflow.com/questions/28538918/pass-parameter-to-gulp-task#answer-32937333
    production: process.argv.indexOf('--production') > -1 || false,
    // cviceni: {
    //   index: process.argv.indexOf('--cviceni') || false,
    //   value: config.cmd.cviceni.index > -1 ? process.argv[config.cmd.cviceni.index + 1] : false,
    // },
  },
  // FOLDERS
  src: {
    folder: 'src/',
    data: {
      folder: 'src/data/',
      json: 'src/data/**/*.json',
      bundle: 'src/data/cviceni.json',
    },
    fonts: {
      folder: 'src/fonts/',
      files: 'src/fonts/**/*.*',
    },
    img: {
      folder: 'src/img/',
      files: 'src/img/**/*.{jpg,png,svg,gif}',
    },
    js: {
      app: 'src/js/app.js',
      components: 'src/js/components/components.js',
      files: 'src/js/**/*.js',
      library: 'src/js/lib/',
      vendorFiles: 'src/js/vendor/**/*.js',
    },
    pug: {
      views: 'src/views/**/*.pug',
      index: 'src/views/index.pug',
      partials: 'src/views/_partials/**/*.pug',
    },
    scss: 'src/scss/**/*.scss',
    text: {
      folder: 'src/text/',
      html: 'src/text/**/*.html',
    },
    scaffolding: {
      folder: 'src/scaffolding/',
      data: {
        folder: 'src/scaffolding/data/',
      },
      views: {
        folder: 'src/scaffolding/views/',
        cviceni: {
          folder: 'src/scaffolding/views/cviceni/',
        },
      },
      text: {
        folder: 'src/scaffolding/text/',

      },
    },
  },
  tmp: {
    folder: 'tmp/',
    data: {
      folder: 'tmp/data/',
      cviceni: 'tmp/data/cviceni.json',
    },
    js: {
      folder: 'tmp/js/',
      src: 'tmp/js/**/*.js',
    },
    pug: {
      folder: 'tmp/pug/',
      index: 'tmp/pug/index.pug',
      src: 'tmp/pug/**/*.pug',
    },
  },
  dist: {
    folder: 'dist/',
    audio: 'dist/cviceni/assets/audio/',
    cviceni: 'dist/cviceni/',
    css: 'dist/cviceni/assets/css/',
    fonts: 'dist/cviceni/assets/fonts/',
    img: 'dist/cviceni/assets/img/',
    js: 'dist/cviceni/assets/js/',
    jsVendor: 'dist/cviceni/assets/js/vendor/',
    pdf: 'dist/cviceni/assets/pdf/',
  },
  // plugin settings
  // SERVER
  browserSync: {
    // proxy: 'localhost:' + config.port,
    // port: 3000,
    server: 'dist/',
    files: null,
    // files: 'dist/**/*.*',
    ghostMode: {
      click: true,
      // location: true,
      forms: true,
      scroll: true,
    },
    injectChanges: true,
    logFileChanges: true,
    logLevel: 'info',
    notify: false,
    reloadDelay: 380,
    ui: {
      port: 3001
    }
  },
  // IMAGES
  images: {},
  // PLUMBER
  plumber: {
    errorHandler: $.notify.onError('Error: <%= error.message %>'),
  },
  // POSTCSS
  postcss: {
    plugins: [
      postcssAutoprefixer({
        cascade: true,
        precision: 10,
      }),
      postcssCssnano(),
    ],
  },
  // PUG
  pug: {
    pretty: false
  },
  // ROLLUP
  rollup: {
    bundle: {
      input: 'src/js/app.js',
      plugins: [
        rollupNodeResolve(),
        rollupBabel({
          exclude: 'node_modules/**',
        }),
      ],
    },
    output: {
      file: 'dist/assets/js/app.build.js',
      format: 'iife',
      name: 'mdh',
      sourcemap: true,
    },
  },
  components: {
    bundle: {
      input: 'src/js/components/components.js',
      plugins: [
        rollupNodeResolve(),
        rollupBabel({
          exclude: 'node_modules/**',
        }),
      ],
    },
    output: {
      file: 'dist/cviceni/assets/js/components.build.js',
      format: 'iife',
      name: 'components',
      sourcemap: true,
    }
  },
  // SASS
  sass: {
    errLogToConsole: true,
    outputStyle: 'expanded',
  },
};

config.pug.locals = {};


// ==========================================
// 4. TASKS
// ==========================================
// CLEAN
gulp.task('clean', (done) => {
  return del(['dist', 'temp'], done);
});

gulp.task('clean-dist-article', (done) => {
  return del(['dist/article'], done);
});

// SERVER
gulp.task('serve', () => {
  return startBrowserSync();
});

gulp.task('reload', () => {
  return browserSync.reload();
});

// pug:index & pug:home (pug -> html)
gulp.task('pug', () => {
  return gulp.src(['src/views/**/*.pug'])
    .pipe(
      $.data(() => JSON.parse(fs.readFileSync('./temp/data_merged.json')))
    )
    .pipe($.pug(config.pug))
    .pipe(gulp.dest('dist/'))
    .pipe(browserSync.reload({
      stream: true,
    }));
});

// SASS
gulp.task('sass', () => {
  return gulp.src('src/scss/main.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass(config.sass).on('error', $.sass.logError))
    .pipe($.sourcemaps.write(gulp.dest('dist/assets/css')))
    .pipe($.autoprefixer({
      browsers: ['last 4 versions'],
      cascade: false,
    }))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(browserSync.reload({
      stream: true,
    }));
});


gulp.task('js', async () => {
  const bundle = await rollup(config.rollup.bundle);
  bundle.write(config.rollup.output);

  browserSync.reload({
    stream: true,
  });

});



// IMAGES
gulp.task('images', () => gulp.src('src/images/**/*.{jpg,png,svg,gif,pdf}')
    .pipe(gulp.dest('dist/assets/images')));

gulp.task('mergeJson', () => {
  return gulp.src('./nastaveni.json', './data/**/*.json', '!./data/data_merge.json')
  .pipe($.mergeJson({
    fileName: 'data_merged.json',
  }))
  .pipe(gulp.dest('./temp/'));
});

gulp.task('copyToDist', () => {
  return gulp.src(['.htaccess', './copy-to-dist/**/*'])
  .pipe(gulp.dest('./dist/'));
});

gulp.task('deployFtp', () => {

  const conn = ftp.create( {
    host: ftpSettings.ftp.host,
    user: ftpSettings.ftp.user,
    password: ftpSettings.ftp.password,
    parallel: 10,
    timeOffset: ftpSettings.ftp.time
  });

  return gulp.src( ftpSettings.globs, {base: ftpSettings.base, buffer: false})
    .pipe(conn.newerOrDifferentSize(ftpSettings.ftp.dir))
    .pipe(conn.dest(ftpSettings.ftp.dir))
    .pipe(browserSync.stream());

});

gulp.task('watch', () => {

  gulp.watch(['src/views/**/*.pug'], gulp.series('pug'));
  gulp.watch('nastaveni.json', gulp.series('pug'));
  gulp.watch('src/js/**/*.js', gulp.series('js'));
  gulp.watch(['site.webmanifest'], gulp.series('pug'));
  gulp.watch('src/scss/**/*.scss', gulp.series('sass'));
  gulp.watch(['src/images/**/*.+(png|jpg|jpeg|gif|svg|pdf)'], gulp.series('sass'));

});

// GULP:build
gulp.task('build', gulp.series('clean', 'mergeJson', 'pug', 'sass', 'js', 'images', 'copyToDist'));


// GULP:default
gulp.task('default', gulp.series('build', 'watch'));
