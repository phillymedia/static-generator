var uglify = require('gulp-uglify');

module.exports = function(gulp, plugins) {
        return function() {
            return gulp.src('./.tmp/js/*.js')
            .pipe(uglify())
                .pipe(gulp.dest('.tmp/js/'))
            };
        };
