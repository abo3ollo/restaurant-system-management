import CashierScreen from "./(pages)/cashier/page";
import HomePage from "./(pages)/home/page";



export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="grow">
        {/* <CashierScreen/> */}
        <HomePage/>
        
      </main>
      
    </div>
  );
}
