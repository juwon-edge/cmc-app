cmake_minimum_required(VERSION 3.22)
project(NitroBoTSort)

# Enforce strict C++17 optimization rules
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

# 1. Fetch motcpp — https://github.com/Geekgineer/motcpp
FetchContent_Declare(
  motcpp
  GIT_REPOSITORY https://github.com/Geekgineer/motcpp.git
  GIT_TAG        main
)
FetchContent_MakeAvailable(motcpp)

# 2. Fetch pre-stripped opencv-mobile distribution — https://github.com/nihui/opencv-mobile
# Using release v36 (opencv 5.0.0). Pin a version tag rather than "latest" so this
# CMake stays reproducible even after upstream cuts a newer release.
FetchContent_Declare(
  opencv_mobile_android
  URL https://github.com/nihui/opencv-mobile/releases/download/v36/opencv-mobile-2.4.13.7-android.zip
)
FetchContent_MakeAvailable(opencv_mobile_android)

set(OpenCV_DIR ${opencv_mobile_android_SOURCE_DIR}/sdk/native/jni)
find_package(OpenCV REQUIRED core imgproc)

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