var postcss = require('gulp-postcss');
var precss = require('precss');
var autoprefixer = require('autoprefixer');
var replace = require('gulp-replace');


module.exports = function(gulp, plugins) {
    return function() {
        return gulp.src(['./src/css/styles.css', './src/project/project.css', './src/css/bootstrap.css', './src/css/glyphicons.css'])
            .pipe(replace('font-size 16px;', 'font-size: 16px;'))

            .pipe(replace("Gotham Narrow SSm A,Gotham Narrow SSm B,", "Roboto,"))
            .pipe(replace("Sentinel SSm A,Sentinel SSm B,", "IBM Plex Serif,"))
            .pipe(replace('"Sentinel SSm A", "Sentinel SSm B",', "IBM Plex Serif,"))
            .pipe(replace('"Sentinel SSm A","Sentinel SSm B",', '"IBM Plex Serif",'))

            .pipe(replace('"Gotham Narrow SSm A", "Gotham Narrow SSm B",', '"Roboto",'))
            .pipe(replace('"Gotham Narrow SSm A","Gotham Narrow SSm B"', '"Roboto"'))
            .pipe(replace('<style>', ''))
            .pipe(replace('</style>', ''))

            .pipe(postcss([precss(), autoprefixer()]))



            .pipe(gulp.dest('.tmp/css'))
            .pipe(plugins.browserSync.reload({
                stream: true
            }))
    };
};
