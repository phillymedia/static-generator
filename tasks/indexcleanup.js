var htmlmin = require('gulp-htmlmin');
var del = require('del');

module.exports = function(gulp, plugins) {
    return function() {
        return gulp.src('dist/inline/index.html')
            .pipe(plugins.gulpIf('*.html', htmlmin({
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: true,
                preserveLineBreaks: true,
                removeComments: true
            })))
            .pipe(gulp.dest('dist/'));

    };
};
