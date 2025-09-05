package com.seemidia.display

import android.graphics.BitmapFactory
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import com.insightface.sdk.inspireface.InspireFace
import com.insightface.sdk.inspireface.base.CustomParameter
import com.insightface.sdk.inspireface.base.FaceAttributeResult
import com.insightface.sdk.inspireface.base.ImageStream
import com.insightface.sdk.inspireface.base.MultipleFaceData
import com.insightface.sdk.inspireface.base.Session
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.seemidia/insightface"
    private var launched: Boolean = false
    private var session: Session? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Force fullscreen mode
        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Hide system UI and navigation bar
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        or View.SYSTEM_UI_FLAG_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                )
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call: MethodCall, result: MethodChannel.Result ->
                when (call.method) {
                    "init" -> {
                        val ok = ensureLaunched()
                        result.success(ok)
                    }
                    "analyze" -> {
                        val path = call.argument<String>("path")
                        if (path.isNullOrEmpty()) {
                            result.success(emptyResult())
                        } else {
                            result.success(analyzeOnce(path))
                        }
                    }
                    else -> result.notImplemented()
                }
            }
    }

    private fun ensureLaunched(): Boolean {
        if (launched && session != null) return true
        try {
            // Launch models
            launched = InspireFace.GlobalLaunch(this, InspireFace.PIKACHU)
            if (!launched) return false

            // Create a session with attributes enabled
            val param: CustomParameter = InspireFace.CreateCustomParameter()
                .enableRecognition(false)
                .enableFaceQuality(false)
                .enableFaceAttribute(true)
                .enableInteractionLiveness(false)
                .enableLiveness(false)
                .enableMaskDetect(false)
            session = InspireFace.CreateSession(
                param,
                InspireFace.DETECT_MODE_ALWAYS_DETECT,
                10,
                -1,
                -1
            )
            return session != null
        } catch (e: Throwable) {
            e.printStackTrace()
            return false
        }
    }

    private fun analyzeOnce(path: String): Map<String, Any> {
        val sess = session ?: return emptyResult()
        try {
            val bmp = BitmapFactory.decodeFile(path) ?: return emptyResult()
            val stream: ImageStream = InspireFace.CreateImageStreamFromBitmap(
                bmp,
                InspireFace.CAMERA_ROTATION_0
            )
            val multi: MultipleFaceData = InspireFace.ExecuteFaceTrack(sess, stream)
            val total = multi.detectedNum

            var men = 0
            var women = 0
            val ages = ArrayList<Int>()

            if (total > 0) {
                val need = InspireFace.CreateCustomParameter()
                    .enableFaceAttribute(true)
                val ok = InspireFace.MultipleFacePipelineProcess(sess, stream, multi, need)
                if (ok) {
                    val attr: FaceAttributeResult = InspireFace.GetFaceAttributeResult(sess)
                    // Gender mapping per SDK: 0 = Woman, 1 = Man
                    // If results look inverted, swap the mapping below.
                    for (i in 0 until total) {
                        try {
                            val g = attr.gender[i]
                            if (g == 1) men++ else women++
                            val b = attr.ageBracket[i]
                            // Convert bracket index to approximate age (midpoint of range)
                            val approx = bracketToAge(b)
                            ages.add(approx)
                        } catch (_: Throwable) {}
                    }
                }
            }

            val maxAge = ages.maxOrNull() ?: 0
            val minAge = ages.minOrNull() ?: 0
            val avgAge = if (ages.isNotEmpty()) {
                kotlin.math.round(ages.sum().toDouble() / ages.size).toInt()
            } else 0

            InspireFace.ReleaseImageStream(stream)

            val genderMap = mapOf(
                "Woman" to women,
                "Man" to men,
            )
            val ageMap = mapOf(
                "max" to maxAge,
                "min" to minAge,
                "average" to avgAge,
            )
            return mapOf(
                "gender" to genderMap,
                "men" to men,
                "women" to women,
                "total" to total,
                "age" to ageMap,
                "method" to "InsightFace",
            )
        } catch (e: Throwable) {
            e.printStackTrace()
            return emptyResult()
        }
    }

    private fun bracketToAge(bracket: Int): Int {
        // Typical buckets; adjust to SDK docs if available
        val ranges = listOf(
            4..12,   // 0: child
            13..17,  // 1: teen
            18..24,  // 2: young adult
            25..34,  // 3
            35..44,  // 4
            45..54,  // 5
            55..64,  // 6
            65..80   // 7+
        )
        return if (bracket in ranges.indices) {
            val r = ranges[bracket]
            (r.first + r.last) / 2
        } else {
            // Fallback linear estimate
            5 + bracket * 10
        }
    }

    private fun emptyResult(): Map<String, Any> = mapOf(
        "gender" to mapOf("Woman" to 0, "Man" to 0),
        "men" to 0,
        "women" to 0,
        "total" to 0,
        "age" to mapOf("max" to 0, "min" to 0, "average" to 0),
        "method" to "InsightFace",
    )
}
