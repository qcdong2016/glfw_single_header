cmake_minimum_required(VERSION 3.20)

project(glfw_single_header)

set(SRC example.c)

if (WIN32)
    add_definitions(-DGLFW_BUILD_WIN32)
endif()

if (APPLE)
    add_definitions(-DGLFW_BUILD_COCOA)
    list(APPEND SRC example_apple_only.m)

    link_libraries("-framework Cocoa" "-framework IOKit" "-framework CoreFoundation")
endif()

add_executable(glfw_single_header_example ${SRC})

set(GLFW_BUILD_EXAMPLES ON)
add_subdirectory(glfw)