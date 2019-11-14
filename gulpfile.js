const gulp = require('gulp');
const sass = require('gulp-sass');
const uglifycss = require('gulp-uglifycss');
const rimraf = require('rimraf');
const panini = require('panini');
const browserSync = require('browser-sync').create();
var concat = require('gulp-concat');

gulp.task('build',
    gulp.series(clean, gulp.parallel(pages, javascript, images, copy), sassToCSS))
/*
gulp.task('build',
    gulp.series(clean, gulp.parallel(pages, javascript, images, copy), sassToCSS, styleGuide));
*/

// Build the site, run the server, and watch for file changes
gulp.task('default',
    gulp.series('build', server, watch))

// Delete the "dist" folder. This happens before every build
function clean(done) {
    rimraf('./dist', done);
}

// Copy files out of the assets folder
// This task skips over the "img", "js", and "scss" folders, which are parsed separately
function copy() {
    return gulp.src("./src/assets/**/*", "!src/assets/{img,js,scss}/**/*")
        .pipe(gulp.dest('./dist',+ '/assets'));
}

// Compiles the files from the src folder and outputs to the dist folder
function sassToCSS() {
    return gulp.src('./src/assets/scss/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(uglifycss({
            //"maxLineLen": 80, Can use this line to set a max length for the minified file. When removed all css runs on one line
            "uglyComments": true
        }))
        .pipe(gulp.dest('./dist/assets/css'));
};

// Copy page templates into finished HTML files. This works now
function pages() {
    return gulp.src('./src/pages/**/*.{html,hbs,handlebars}')
        .pipe(panini({
            root: './src/pages/',
            layouts: './src/layouts/',
            partials: './src/partials/',
            helpers: './src/helpers/',
            data: './src/data/'
        }))
        .pipe(gulp.dest('./dist/'));
};

// Load updated HTML templates and partials into Panini
function resetPages(done) {
    panini.refresh();
    done();
}

function javascript() {
    return gulp.src(['./src/assets/js/*.js', './node_modules/bootstrap/dist/js/bootstrap.js'])
        .pipe(concat('app.js'))
        .pipe(gulp.dest('./dist/assets/js'))
}

// Copy images to the "dist" folder
// In production, the images are compressed
//function images() {
//   return gulp.src('src/assets/img/**/*')
//        .pipe($.if(PRODUCTION, $.imagemin([
//            $.imagemin.jpegtran({ progressive: true }),
//        ])))
//        .pipe(gulp.dest(PATHS.dist + '/assets/img'));
//}

// Copy images to the "dist" folder
// In production, the images are compressed
function images() {
    return gulp.src('src/assets/img/**/*')
        .pipe(gulp.dest('./dist', + '/assets/img/'));
}


// Start a server with BrowserSync to preview the site in
function server(done) {
    browserSync.init({
        server: './dist/', port: 8000
    }, done);
}

function watch() {
    gulp.watch('./src/assets/scss/*.scss').on('change', sassToCSS);
    gulp.watch('src/pages/**/*.html').on('change', gulp.series(resetPages, pages, browserSync.reload));
    gulp.watch('src/{layouts,partials}/**/*.html').on('change', gulp.series(resetPages, pages, browserSync.reload));
    gulp.watch('src/assets/img/**/*').on('all', gulp.series(images, browserSync.reload));
    gulp.watch(['src/assets/js/**/*.{js,json}', './node_modules/bootstrap/js/src/utils.js']).on('all', gulp.series(javascript, browserSync.reload));
}
