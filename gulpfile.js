'use strict';

const { series, parallel, watch, src, dest } = require('gulp');
const tap = require('gulp-tap');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const terser = require('gulp-terser');
const sourcemaps = require('gulp-sourcemaps');

const rollup = require('@rbnlffl/gulp-rollup');

const basepath = process.env.BASEPATH || '';
const debug = process.env.DEBUG || true;


const temp = '.';



function _dst(dir, src, dst) {
  return dir.indexOf('/') === -1 ? (dir + '/' + dst) : dir.replace(src, dst);
}

function _crt(contents) {
  contents = contents.replace('Object.defineProperty(exports, \'__esModule\', { value: true });', '')
                     .replace(/exports\.([^ ]+) = [^;]+;/, 'export { $1 };')
                     .replace(/exports\.([^ ]+) = [^;]+;/, 'export { $1 };');

  return contents;
}


function js() {
  return src([basepath + 'src/js/**/*.js', /*basepath + 'index.js',*/ '!node_modules/**/*.js'])
    .pipe(rollup(null, { format: 'cjs' }))
    .pipe(tap(function(file) {
      file.contents = Buffer.from(_crt(file.contents.toString()));
    }))
    .pipe(sourcemaps.init({ loadMaps: false, debug }))
    .pipe(babel())
    .pipe(rename(function(path) {
      path.dirname = _dst(path.dirname, 'src', 'dist');
      path.basename = 'ensemble-' + path.basename.toLowerCase();
    }))
    .pipe(sourcemaps.write('.', { includeContent: false }))
    .pipe(dest(temp));
}

function js_compat() {
  return src([basepath + 'src/js/**/*.js', /*basepath + 'index.js',*/ '!node_modules/**/*.js'])
    .pipe(rollup(null, { format: 'cjs' }))
    .pipe(tap(function(file) {
      file.contents = Buffer.from(_crt(file.contents.toString()));
    }))
    .pipe(sourcemaps.init({ loadMaps: false, debug }))
    .pipe(babel({ presets: [ [ "@babel/preset-env", { targets: 'defaults' } ] ] }))
    .pipe(rename(function(path) {
      path.dirname = _dst(path.dirname, 'src', 'dist');
      path.basename = 'ensemble-' + path.basename.toLowerCase() + '-compat';
    }))
    .pipe(sourcemaps.write('.', { includeContent: false }))
    .pipe(dest(temp));
}

function js_uglify() {
  return src([basepath + 'dist/js/**/*.js', '!**/*.min.js', '!node_modules/**/*.js'])
    .pipe(sourcemaps.init({ loadMaps: false, debug: false }))
    .pipe(terser())
    .pipe(rename(function(path) {
      path.extname = '.min' + path.extname;
    }))
    .pipe(sourcemaps.write('.', { includeContent: false }))
    .pipe(dest(temp));
}

function css() {
  return src([basepath + 'src/scss/**/*.scss', '!node_modules/**/*.scss'])
    .pipe(sourcemaps.init({ loadMaps: false, debug }))
    .pipe(sass({ outputStyle: 'nested' }).on('error', sass.logError))
    .pipe(rename(function(path) {
      path.dirname = _dst(path.dirname, 'src', 'dist');
      path.dirname = path.dirname.replace('scss', 'css');
      path.basename = 'ensemble-' + path.basename;
    }))
    .pipe(sourcemaps.write('.', { includeContent: false }))
    .pipe(dest(temp));
}

function css_compat() {
  return src([basepath + 'src/scss/**/*.scss', '!node_modules/**/*.scss'])
    .pipe(sourcemaps.init({ loadMaps: false, debug }))
    .pipe(sass({ outputStyle: 'nested' }).on('error', sass.logError))
    .pipe(rename(function(path) {
      path.dirname = _dst(path.dirname, 'src', 'dist');
      path.dirname = path.dirname.replace('scss', 'css');
      path.basename = 'ensemble-' + path.basename + '-compat';
    }))
    .pipe(sourcemaps.write('.', { includeContent: false }))
    .pipe(dest(temp));
}

function css_uglify() {
  return src([basepath + 'src/scss/**/*.scss', '!node_modules/**/*.scss'])
    .pipe(sourcemaps.init({ loadMaps: false, debug }))
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(rename(function(path) {
      path.dirname = _dst(path.dirname, 'src', 'dist');
      path.dirname = path.dirname.replace('scss', 'css');
      path.basename = 'ensemble-' + path.basename;
      path.extname = '.min' + path.extname;
    }))
    .pipe(sourcemaps.write('.', { includeContent: false }))
    .pipe(dest(temp));
}

function demo_css() {
  return src('./ensemble-stack-d1/misc/demo/*.scss')
    .pipe(sourcemaps.init({ loadMaps: false, debug }))
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(rename(function(path) {
      path.dirname += '/ensemble-' + path.basename + '/demo';
      path.basename = 'demo-ensemble-' + path.basename;
    }))
    .pipe(sourcemaps.write('.', { includeContent: false }))
    .pipe(dest(temp));
}

function watcher() {
  watch(basepath + 'src/scss/**/*.scss', series(css, css_uglify));
  watch(basepath + 'src/js/**/*.js', series(js, js_uglify));
}


const build = parallel([series([js, js_uglify]), parallel([css, css_uglify])]);

exports.default = build;
exports.compat = parallel([series([js_compat, js_uglify]), parallel([/*css_compat, */css_uglify])]);
exports.watcher = watcher;
exports.demo = demo_css;
