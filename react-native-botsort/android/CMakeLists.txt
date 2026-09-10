cmake_minimum_required(VERSION 3.22)
project(NitroBotsort)
set(PACKAGE_NAME NitroBotsort)

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
set(YAML_BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
set(YAML_CPP_INSTALL ON CACHE BOOL "" FORCE)   # required — export() below needs this

FetchContent_Declare(
  yaml-cpp
  GIT_REPOSITORY https://github.com/jbeder/yaml-cpp.git
  GIT_TAG        0.8.0
)
FetchContent_MakeAvailable(yaml-cpp)

# Build-tree package config matching the 0.8.0-era upstream template's expected
# variable names (this predates the Oct 2023 upstream fix that switched to
# CMAKE_CURRENT_LIST_DIR-based target lookup and dropped the namespaced
# EXPORT_TARGETS from check_required_components — 0.8.0 still uses the older
# PATH_VAR-based CONFIG_EXPORT_DIR mechanism and expects a plain, non-namespaced
# EXPORT_TARGETS value).
set(YAML_BUILD_SHARED_LIBS OFF)
set(CONFIG_EXPORT_DIR "${yaml-cpp_BINARY_DIR}")
set(EXPORT_TARGETS "yaml-cpp")
set(CMAKE_INSTALL_INCLUDEDIR "${yaml-cpp_SOURCE_DIR}/include")
set(CMAKE_INSTALL_LIBDIR "${yaml-cpp_BINARY_DIR}")

configure_package_config_file(
  "${yaml-cpp_SOURCE_DIR}/yaml-cpp-config.cmake.in"
  "${yaml-cpp_BINARY_DIR}/yaml-cpp-config.cmake"
  INSTALL_DESTINATION "${yaml-cpp_BINARY_DIR}"
  PATH_VARS
    CMAKE_INSTALL_INCLUDEDIR
    CMAKE_INSTALL_LIBDIR
    CONFIG_EXPORT_DIR
    YAML_BUILD_SHARED_LIBS
)

export(TARGETS yaml-cpp
  FILE "${yaml-cpp_BINARY_DIR}/yaml-cpp-targets.cmake"
  NAMESPACE yaml-cpp::
)

set(yaml-cpp_DIR "${yaml-cpp_BINARY_DIR}" CACHE PATH "" FORCE)
list(PREPEND CMAKE_PREFIX_PATH "${yaml-cpp_DIR}")
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
        ../nitrogen/generated/android/NitroBotsortOnLoad.cpp
)

# Add Nitrogen specs :)
# This filename must match the generated file exactly, including case.
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroBotsort+autolinking.cmake)

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