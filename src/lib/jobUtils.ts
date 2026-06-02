import { Job } from '../types';

/**
 * Checks if a job is currently active based on its status and scheduled dates.
 */
export const isJobActive = (job: Job): boolean => {
    // Only published or active jobs can be considered active
    if (job.status !== 'active' && job.status !== 'Published') {
        return false;
    }

    const now = new Date().getTime();
    
    // Support both old and new date field names
    const publishTime = job.scheduledPublishAt ? new Date(job.scheduledPublishAt).getTime() : 
                        (job.scheduledPublishDate ? new Date(job.scheduledPublishDate).getTime() : 0);
    const removalTime = job.scheduledArchiveAt ? new Date(job.scheduledArchiveAt).getTime() : 
                        (job.scheduledRemovalDate ? new Date(job.scheduledRemovalDate).getTime() : Infinity);
    
    const hasPublishDate = !!(job.scheduledPublishAt || job.scheduledPublishDate);
    const hasRemovalDate = !!(job.scheduledArchiveAt || job.scheduledRemovalDate);

    return (!hasPublishDate || now >= publishTime) && 
           (!hasRemovalDate || now <= removalTime);
};
