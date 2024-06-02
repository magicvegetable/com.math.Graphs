#include "file-ops.h"

extern int errno;

int valid_dir(const char* dir) {
    return strcmp(".", dir) && strcmp("..", dir);
}

int create_filepath(const char* path) {
    struct stat sb;

    size_t len = strlen(path);
    for (size_t i = 1; i < len; i++) {
        if (path[i] == '/') {
            char dir[i + 1];
            snprintf(dir, i + 1, "%s", path);

            int status = stat(dir, &sb);
            if (status == -1 && errno == ENOENT) {
                status = mkdir(dir, S_IRWXU | S_IRGRP | S_IXGRP | S_IXOTH);
                if (status == -1) {
                    fprintf(stderr, "Failed to create %s directory\n", dir);
                    return -1;
                }
            } else if (!S_ISDIR(sb.st_mode)) {
                fprintf(stderr, "File %s is not directory\n", dir);
                return -1;
            }
        }
    }
    return 0;
}

int mkdir_recursive(const char* path) {
    int len = strlen(path);
    if (path[len - 1] != '/') {
        char adjusted_path[len + 1];
        sprintf(adjusted_path, "%s/", path);
        return create_filepath(adjusted_path);
    } else {
        return create_filepath(path);
    }
}

int copy_file(const char* src, const char* dest) {
    FILE *src_file = fopen(src, "rb");
    if (src_file == NULL) {
        fprintf(stderr, "Failed to open %s file\n", src);
        return -1;
    }

    FILE *dest_file = fopen(dest, "wb");
    if (dest_file == NULL) {
        int status = create_filepath(dest);
        if (status == -1) {
            fprintf(stderr, "Failed to open & create %s file\n", dest);
            return -1;
        }
        dest_file = fopen(dest, "wb");
    }

    for (char ch = fgetc(src_file);
        ch != EOF;
        ch = fgetc(src_file)
    ) fputc(ch, dest_file);

    fclose(dest_file);
    fclose(src_file);
    return 0;
}

int copy_dir(const char* src, const char* dest) {
    DIR *src_dir = opendir(src);
    if (src_dir == NULL) {
        fprintf(stderr, "Failed to open %s directory\n", src);
        return -1;
    }

    DIR *dest_dir = opendir(dest);
    if (dest_dir == NULL) {
        int status = mkdir_recursive(dest);
        if (status == -1) {
            fprintf(stderr, "Failed to open & create %s directory\n", dest);
            return -1;
        }
        dest_dir = opendir(dest);
    }

    char sub_src[1024];
    char sub_dest[1024];

    for (struct dirent *ent = readdir(src_dir);
        ent != NULL;
        ent = readdir(src_dir)
    ) {
        sprintf(sub_src, "%s/%s", src, ent->d_name);
        sprintf(sub_dest, "%s/%s", dest, ent->d_name);
        if (ent->d_type == DT_REG) {
            copy_file(sub_src, sub_dest);
        } else if (ent->d_type == DT_DIR && valid_dir(ent->d_name)) {
            copy_dir(sub_src, sub_dest);
        }
    }

    closedir(dest_dir);
    closedir(src_dir);
    return 0;
}

