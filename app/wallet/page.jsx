import Btn from "../../component/Btn";

export default function page() {
  return (
    <main className="w-full min-h-[calc(100vh)]">
      <div className="w-full px-4 py-6 sm:p-10 flex flex-col items-center gap-4">
        <div className="w-full sm:w-3/4 lg:w-2/4 flex flex-col items-center gap-8">
          
          {/* Wallet Card */}
          <div className="w-full rounded-xl bg-green-400 p-6 sm:p-8 flex flex-col items-center">
            <h1 className="text-lg sm:text-xl text-white font-bold">
              Wallet Balance
            </h1>
            <div className="text-3xl sm:text-4xl text-white font-bold mt-2">
              ₹ 0.00
            </div>
          </div>

          {/* Button */}
          <Btn
            variant="primary"
            className="w-full text-lg sm:text-[20px]"
          >
            Add Money
          </Btn>

          {/* Transactions Title */}
          <h1 className="text-lg sm:text-xl w-full text-start font-bold">
            Recent Transactions
          </h1>

        </div>
      </div>
    </main>
  );
}
