# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Keep Capacitor Core & Plugins
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.NativePlugin class * { *; }

-keepclassmembers class * {
    @com.getcapacitor.PluginMethod *;
    @com.getcapacitor.annotation.PermissionCallback *;
    @com.getcapacitor.annotation.ActivityCallback *;
}

# Keep Railway Tracking App classes
-keep class com.railwaytracking.app.** { *; }
-keepclassmembers class com.railwaytracking.app.** { *; }
