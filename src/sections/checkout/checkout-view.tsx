import { CheckoutForm } from "./checkout-form";


export default function CheckoutView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-300 flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <CheckoutForm />
      </main>
    </div>
  );
}
