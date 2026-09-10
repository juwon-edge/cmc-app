cmake_minimum_required(VERSION 3.22)
project(NitroBoTSort)

# Enforce strict C++17 optimization rules
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

FetchContent_Declare(
  Eigen3
  GIT_REPOSITORY https://gitlab.com/libeigen/eigen.git
  GIT_TAG        3.4.0
)
set(EIGEN_BUILD_DOC OFF CACHE BOOL "" FORCE)
set(BUILD_TESTING OFF CACHE BOOL "" FORCE)
set(EIGEN_BUILD_PKGCONFIG OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(Eigen3)

# motcpp does a `find_package(Eigen3 CONFIG REQUIRED)` during its own configure step.
# FetchContent gives us the Eigen build tree, but not an installed package prefix, so
# we must expose the generated config location to CMake before motcpp is configured.
if(DEFINED eigen3_BINARY_DIR)
    set(Eigen3_DIR "${eigen3_BINARY_DIR}")
    set(eigen3_DIR "${eigen3_BINARY_DIR}")
endif()
if(DEFINED Eigen3_BINARY_DIR)
    set(Eigen3_DIR "${Eigen3_BINARY_DIR}")
    set(eigen3_DIR "${Eigen3_BINARY_DIR}")
endif()
list(PREPEND CMAKE_PREFIX_PATH "${Eigen3_DIR}" "${eigen3_DIR}")
set(CMAKE_FIND_PACKAGE_PREFER_CONFIG ON)

set(YAML_CPP_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(YAML_CPP_BUILD_TOOLS OFF CACHE BOOL "" FORCE)
set(YAML_CPP_BUILD_CONTRIB OFF CACHE BOOL "" FORCE)
FetchContent_Declare(
  yaml-cpp
  GIT_REPOSITORY https://github.com/jbeder/yaml-cpp.git
  GIT_TAG        0.8.0
)
FetchContent_MakeAvailable(yaml-cpp)

# yaml-cpp's generated package config assumes an install prefix and points
# YAML_CPP_INCLUDE_DIR to `${prefix}/include`, which does not exist for a
# FetchContent build tree. Override that with a build-tree-compatible package
# config so motcpp's `find_package(yaml-cpp REQUIRED)` succeeds.
if(DEFINED yaml-cpp_BINARY_DIR)
    set(yaml-cpp_DIR "${yaml-cpp_BINARY_DIR}")
    set(YAML_CPP_INCLUDE_DIR "${yaml-cpp_SOURCE_DIR}/include")
    set(YAML_CPP_LIBRARY_DIR "${yaml-cpp_BINARY_DIR}")
    set(YAML_CPP_SHARED_LIBS_BUILT OFF)
    set(YAML_CPP_LIBRARIES "yaml-cpp::yaml-cpp")
    if(NOT TARGET yaml-cpp::yaml-cpp)
        add_library(yaml-cpp::yaml-cpp ALIAS yaml-cpp)
    endif()
    file(WRITE "${yaml-cpp_BINARY_DIR}/yaml-cpp-config.cmake" "[=[\nset(YAML_CPP_INCLUDE_DIR \"${yaml-cpp_SOURCE_DIR}/include\")\nset(YAML_CPP_LIBRARY_DIR \"${yaml-cpp_BINARY_DIR}\")\nset(YAML_CPP_SHARED_LIBS_BUILT OFF)\nset(YAML_CPP_LIBRARIES \"yaml-cpp::yaml-cpp\")\nif(NOT TARGET yaml-cpp::yaml-cpp)\n  add_library(yaml-cpp::yaml-cpp ALIAS yaml-cpp)\nendif()\nset(yaml-cpp_FOUND TRUE)\n]=]")
    list(PREPEND CMAKE_PREFIX_PATH "${yaml-cpp_DIR}")
endif()
if(DEFINED YAML_CPP_BINARY_DIR)
    set(yaml-cpp_DIR "${YAML_CPP_BINARY_DIR}")
    list(PREPEND CMAKE_PREFIX_PATH "${yaml-cpp_DIR}")
endif()
set(CMAKE_FIND_PACKAGE_PREFER_CONFIG ON)

FetchContent_Declare(
  opencv_mobile_android
  URL https://github.com/nihui/opencv-mobile/releases/download/v35/opencv-mobile-4.13.0-android.zip
)
FetchContent_MakeAvailable(opencv_mobile_android)

set(OpenCV_DIR ${opencv_mobile_android_SOURCE_DIR}/sdk/native/jni)
find_package(OpenCV REQUIRED core imgproc)


# 1. Fetch motcpp — https://github.com/Geekgineer/motcpp
FetchContent_Declare(
  motcpp
  GIT_REPOSITORY https://github.com/Geekgineer/motcpp.git
  GIT_TAG        main
)
FetchContent_MakeAvailable(motcpp)

# Define the single shared library target for this native module.
# cpp-adapter.cpp is the Nitro-generated JNI entry point; the autolinking
# include below adds your tracker source + generated OnLoad.cpp to THIS target.
add_library(${PACKAGE_NAME} SHARED
        src/main/cpp/cpp-adapter.cpp
        ../cpp/HybridBoTSortTracker.cpp
        ../nitrogen/generated/android/NitroBoTSortOnLoad.cpp
)

# Add Nitrogen specs :)
# Double check this filename matches exactly what's in nitrogen/generated/android/
# (case-sensitive on most Linux/CI filesystems) — likely NitroBoTSort+autolinking.cmake
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroBoTSort+autolinking.cmake)

# Set up local includes
include_directories(
        "src/main/cpp"
        "../cpp"
)

find_library(LOG_LIB log)

# Link all libraries together — single consolidated call
target_link_libraries(${PACKAGE_NAME}
        ${LOG_LIB}
        android                                   # <-- Android core
        react-native-nitro-modules::nitro
        motcpp::motcpp
        ${OpenCV_LIBS}
)

# Export only the explicit initialization hook required by Nitro's JSI runtime loader
set_target_properties(${PACKAGE_NAME} PROPERTIES
        CXX_VISIBILITY_PRESET hidden
        VISIBILITY_INLINES_HIDDEN ON
)

# --- ADVANCED MODULE COMPILER SIZE STRIPPING ---
if(NOT CMAKE_BUILD_TYPE OR CMAKE_BUILD_TYPE STREQUAL "Debug")
    # Keep debug symbols intact during desk testing phases
else()
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -flto -fvisibility=hidden -fvisibility-inlines-hidden")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fdata-sections -ffunction-sections")
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,--gc-sections -Wl,--exclude-libs,ALL")
endif()