export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red/5 flex items-center justify-center">
              <i className="fa-solid fa-trash-can text-red/40 text-xl" />
            </div>
            <div>
              <h3 className="text-navy font-bold text-base m-0">Confirm Delete</h3>
              <p className="text-muted text-sm m-0 mt-1">{message}</p>
            </div>
          </div>
          <div className="flex ltr:justify-end rtl:justify-start gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-muted bg-transparent border border-border/70 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-navy/20 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onCancel() }}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red rounded-xl border-0 cursor-pointer hover:bg-red/90 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-trash-can" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
