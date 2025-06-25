import ThemeDemo from "../components/ThemeDemo";
import Layout from "../components/Layout";

const ThemeDemoPage = () => {
  return (
    <Layout showSidebar={true}>
      <div className="container mx-auto py-6">
        <ThemeDemo />
      </div>
    </Layout>
  );
};

export default ThemeDemoPage; 