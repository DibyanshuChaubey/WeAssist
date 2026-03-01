import { HostelIssue, Status, Priority, Category } from '../types/index';

export interface FilterOptions {
  searchQuery?: string;
  status?: Status;
  priority?: Priority;
  category?: Category;
}

export const filterIssues = (
  issues: HostelIssue[],
  options: FilterOptions
): HostelIssue[] => {
  const { searchQuery = '', status, priority, category } = options;

  return issues.filter((issue) => {
    const matchesSearch =
      searchQuery === '' ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.reporterName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = status === undefined || issue.status === status;
    const issuePriority = (issue.priority || 'low') as Priority;
    const matchesPriority = priority === undefined || issuePriority === priority;
    const matchesCategory = category === undefined || issue.category === category;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });
};

export const getSortedIssues = (issues: HostelIssue[]): HostelIssue[] => {
  return [...issues].sort((a, b) => {
    // Sort by priority: high > medium > low
    const priorityOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
    const aPriority = (a.priority || 'low') as Priority;
    const bPriority = (b.priority || 'low') as Priority;
    if (priorityOrder[aPriority] !== priorityOrder[bPriority]) {
      return priorityOrder[bPriority] - priorityOrder[aPriority];
    }

    // Then sort by status: reported > in_progress > resolved_by_admin > closed
    const statusOrder: Record<Status, number> = { reported: 4, in_progress: 3, resolved_by_admin: 2, closed: 1 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[b.status] - statusOrder[a.status];
    }

    // Then sort by date (newest first)
    return new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime();
  });
};

export const getStats = (issues: HostelIssue[]) => {
  return {
    total: issues.length,
    reported: issues.filter((i) => i.status === 'reported').length,
    inProgress: issues.filter((i) => i.status === 'in_progress').length,
    resolvedByAdmin: issues.filter((i) => i.status === 'resolved_by_admin').length,
    closed: issues.filter((i) => i.status === 'closed').length,
    high: issues.filter((i) => (i.priority || 'low') === 'high').length,
  };
};
