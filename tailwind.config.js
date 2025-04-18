// tailwind.config.js
export default {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}", // 指定 TailwindCSS 扫描的文件路径
    ],
    theme: {
        extend: {
            colors: {
                'blue-600': '#2563eb', // 自定义颜色，可以根据需要修改
                'indigo-600': '#4f46e5',
                'gray-900': '#1f2937',
                'gray-700': '#374151',
            },
            spacing: {
                '18': '4.5rem', // 自定义间距
                '72': '18rem',
            },
            boxShadow: {
                'xl': '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
                'lg': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
            },
            fontFamily: {
                sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
