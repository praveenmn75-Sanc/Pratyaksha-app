import os

filepath = "src/App.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Replace 'P' avatar boxes with the vector SVG Eye Branding logo
    old_login_logo = '<div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-extrabold text-sm">\n                  P\n                </div>'
    new_login_logo = '''<div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 p-1.5 shadow-lg shadow-cyan-500/10">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>'''

    old_sidebar_logo = '<div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-extrabold text-base">\n              P\n            </div>'
    new_sidebar_logo = '''<div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 p-1.5 shadow-lg shadow-cyan-500/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>'''

    code = code.replace(old_login_logo, new_login_logo).replace(old_sidebar_logo, new_sidebar_logo)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("Branding logo SVG restored in App.jsx.")
