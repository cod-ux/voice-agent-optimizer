export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Title */}
      <h1 className="text-4xl font-bold text-center text-black mb-7">
        Optimise Voice Agents
      </h1>

      {/* Boxed Tabs for Steps */}
      <div role="tablist" className="tabs tabs-boxed mb-12">
        <a role="tab" className="tab tab-active font-semibold">
          Step 1: Upload Prompt
        </a>
        <a role="tab" className="tab">
          Step 2: Provide Feedback
        </a>
        <a role="tab" className="tab">
          Step 3: Improve Prompt
        </a>
      </div>

      {/* Input Card */}
      <div className="card bg-white shadow-md border border-gray-300 rounded-xl max-w-3xl mx-auto">
        <div className="card-body p-3">
          <textarea
            className="textarea h-96 w-full resize-none focus:outline-none bg-gray-100 text-black placeholder-gray-500"
            placeholder="Paste your prompt here..."
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end mt-6 max-w-3xl mx-auto">
        <button className="btn btn-primary">Next</button>
      </div>
    </div>
  );
}
