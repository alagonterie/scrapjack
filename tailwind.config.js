module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        // 't-sm': '0 -1px 2px 0 rgba(0, 0, 0, 0.1)',
        't-md': '0 -4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        // 't-lg': '0 -10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        // 't-xl': '0 -20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        // 't-2xl': '0 -25px 50px -12px rgba(0, 0, 0, 0.3)'
      },
      animation: {
        "pulsate-fwd": "pulsate-fwd 0.5s ease  both",
        "heartbeat": "heartbeat 5s ease  infinite both",
        "fade-in": "fade-in 0.8s cubic-bezier(0.390, 0.575, 0.565, 1.000)   both",
        "scale-in-top": "scale-in-top 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940)   both",
        "puff-in-center": "puff-in-center 0.3s cubic-bezier(0.470, 0.000, 0.745, 0.715)   both",
        "scale-in-bottom": "scale-in-bottom 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940)   both"
      },
      keyframes: {
        "pulsate-fwd": {
          "0%,to": {
            transform: "scale(1)"
          },
          "50%": {
            transform: "scale(1.1)"
          }
        },
        "heartbeat": {
          "85%": {
            transform: "scale(1)",
            "transform-origin": "center center",
            "animation-timing-function": "ease-out"
          },
          "88%": {
            transform: "scale(.85)",
            "animation-timing-function": "ease-in"
          },
          "90%": {
            transform: "scale(.96)",
            "animation-timing-function": "ease-out"
          },
          "95%": {
            transform: "scale(.78)",
            "animation-timing-function": "ease-in"
          },
          "100%": {
            transform: "scale(1)",
            "animation-timing-function": "ease-out"
          }
        },
        "fade-in": {
          "0%": {
            opacity: "0"
          },
          "65%": {
            opacity: "0"
          },
          to: {
            opacity: "1"
          }
        },
        "scale-in-top": {
          "0%": {
            transform: "scale(0)",
            "transform-origin": "50% 0%",
            opacity: "1"
          },
          to: {
            transform: "scale(1)",
            "transform-origin": "50% 0%",
            opacity: "1"
          }
        },
        "puff-in-center": {
          "0%": {
            transform: "translateY(-72px) translateX(-5px) scale(1.2)",
            filter: "blur(2px)",
            opacity: "0"
          },
          to: {
            transform: "translateY(-57px) translateX(-5px) scale(1.11)",
            filter: "blur(0)",
            opacity: "1"
          }
        },
        "scale-in-bottom": {
          "0%": {
            transform: "scale(0)",
            "transform-origin": "50% 100%",
            opacity: "1"
          },
          to: {
            transform: "scale(1)",
            "transform-origin": "50% 100%",
            opacity: "1"
          }
        }
      }
    },
  },
  plugins: [],
}
