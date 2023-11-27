// run this in node.js 

import * as fs from 'fs'

let common_sources = [
    "context.c",
    "init.c",
    "input.c",
    "monitor.c",
    "platform.c",
    "vulkan.c",
    "window.c",
    "egl_context.c",
    "osmesa_context.c",
]

let windows_sources = [
    "win32_module.c",
    "win32_time.c",
    "win32_thread.c",
    "win32_init.c",
    "win32_joystick.c",
    "win32_monitor.c",
    "win32_window.c",
    "wgl_context.c",
]

let apple_sources = [
    "cocoa_time.c",
    "posix_module.c",
    "posix_thread.c",
    "cocoa_init.m",
    "cocoa_joystick.m",
    "cocoa_monitor.m",
    "cocoa_window.m",
    "nsgl_context.m",
]

function ifndef(src, define) {
    return `#ifndef ${define}\n` + src + `\n#endif // ${define}\n`
}

function ifdef(src, define) {
    return `#ifdef ${define}\n` + src + `\n#endif // ${define}\n`
}

function readSources(root, files, define, skip_line) {
    let src = ""

    for (let f of files) {
        if (fs.existsSync(root + f)) {
            let content = fs.readFileSync(root + f, 'utf-8')
            if (!skip_line) {
                src += `\n#line 1 \"${f}\"\n`
            }
            src += content
        } else {
            console.log("not found", f)
        }
    }

    if (define) {
        src = ifdef(src, define)
    }

    return src
}


let header = readSources("glfw/include/GLFW/", ["glfw3.h", "glfw3native.h"], null, true)

let srcRoot = "glfw/src/"
let src = readSources(srcRoot, common_sources)

// src += readSources(srcRoot, null_sources, '_GLFW_OSMESA')
src += "GLFWbool _glfwConnectNull(int platformID, _GLFWplatform* platform) { return GLFW_TRUE; }"

src += readSources(srcRoot, windows_sources)
src += readSources(srcRoot, apple_sources)

src = header + ifdef(src, "GLFW_IMPLEMENTATION")

let mark = {}

while (true) {
    src = src.replaceAll('#include "../include/GLFW/glfw3.h"', "")
    src = src.replaceAll('#error "You must not define these; define zero or more _GLFW_<platform> macros instead"', "")
    src = src.replaceAll('#pragma once', "")

    let match = src.match(/#include\s+"([\w_.\/]+)"/g)
    if (!match) {
        break
    }
    let has = false
    for (let inc of match) {
        if (mark[inc]) {
            src = src.replace(inc, "")
        } else {
            let f = /#include\s+"([\w_.\/]+)"/g.exec(inc)
            let content = readSources(srcRoot, [f[1]])
            if (content != "") {
                src = src.replace(inc, content)
                has = true
            }
        }
        mark[inc] = true
    }
    if (!has) {
        break
    }
}

let match = src.match(/#define\s+(GL_\w+)\s+(\w+)/g)

if (match) {
    for (let inc of match) {
        let arr = inc.split(" ")
        let newinc = ifndef(inc, arr[1])
        src = src.replace(inc, newinc)
    }
}


fs.writeFileSync("glfw.h", src, 'utf-8')