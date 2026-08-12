import { Header } from './components/Header';
import { Home } from './components/Home';
import { ChatWidget } from './components/ChatWidget';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <Home />
      </main>
      <ChatWidget />
    </div>
  );
}

export default App;