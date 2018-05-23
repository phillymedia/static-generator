var inline = require('gulp-inline');

module.exports = function(gulp, plugins) {
    return function() {
        return gulp.src('.tmp/index.html')
            .pipe(inline({
                base: '.tmp/'
            }))
            .pipe(gulp.dest('dist/inline'));
    };
};
