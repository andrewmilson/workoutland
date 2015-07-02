var gulp = require('gulp');
var rename = require('gulp-rename');
var index = 'www/index.html';

gulp.task('watch', function() {
  gulp.watch(index, function() {
    gulp.src(index).pipe(rename('404.html')).pipe(gulp.dest('www/'));
  })
});

gulp.task('default', ['watch']);
