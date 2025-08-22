/**
 * Generate a smart pagination window showing relevant page numbers
 * Example: 1 … 4 5 [6] 7 8 … 20
 */
export function getPaginationWindow(
  currentPage: number,
  totalPages: number,
  windowSize: number = 5
): (number | "ellipsis")[] {
  if (totalPages <= windowSize + 2) {
    // Show all pages if total is small
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | "ellipsis")[] = []
  const halfWindow = Math.floor(windowSize / 2)

  // Always show first page
  pages.push(1)

  let startPage: number
  let endPage: number

  if (currentPage <= halfWindow + 2) {
    // Near the beginning
    startPage = 2
    endPage = Math.min(windowSize, totalPages - 1)
  } else if (currentPage >= totalPages - halfWindow - 1) {
    // Near the end
    startPage = Math.max(totalPages - windowSize + 1, 2)
    endPage = totalPages - 1
  } else {
    // In the middle
    startPage = currentPage - halfWindow
    endPage = currentPage + halfWindow
  }

  // Add ellipsis before start if needed
  if (startPage > 2) {
    pages.push("ellipsis")
  }

  // Add the window pages
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  // Add ellipsis after end if needed
  if (endPage < totalPages - 1) {
    pages.push("ellipsis")
  }

  // Always show last page (if it's not already included)
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}
