export function ThemeScript() {
  const script = `
    (function () {
      try {
        var stored = window.localStorage.getItem("ui-theme");
        var theme = stored === "dark" || stored === "light"
          ? stored
          : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        document.documentElement.setAttribute("data-theme", theme);
      } catch (error) {
        document.documentElement.setAttribute("data-theme", "light");
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
