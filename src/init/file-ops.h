#ifndef FILE_OPS
#define FILE_OPS

#include <sys/stat.h>
#include <dirent.h>
#include <string.h>
#include <stdio.h>
#include <errno.h>

#define DIR_PERMISSIONS S_IRWXU | S_IRGRP | S_IXGRP | S_IXOTH | S_IROTH

int copy_file(const char* src, const char* dest);
int copy_dir(const char* src, const char* dest);

#endif // !FILE_OPS
