'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ticketService } from '@/src/services/ticketService';

interface Comment {
  id: string;
  comment: string;
  createdByName: string;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  ticketTitle: string;
  ticketDescription: string;
  statusName: string;
  priorityName: string;
  categoryName: string;
  createdByName: string;
  createdAt: string;
  comments: Comment[];
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await ticketService.getById(ticketId);
        setTicket(data);
      } catch (err) {
        setError('Failed to load ticket details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await ticketService.addComment(ticketId, newComment);
      
      const updatedData = await ticketService.getById(ticketId);
      setTicket(updatedData);
      setNewComment('');
    } catch (err) {
      alert('An error occurred while adding the comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="alert alert-error shadow-sm text-white max-w-2xl mx-auto">
        <span>{error || 'Ticket not found.'}</span>
        <button onClick={() => router.push('/tickets')} className="btn btn-sm btn-ghost">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{ticket.ticketTitle}</h1>
          <p className="text-sm text-slate-500">Created by: {ticket.createdByName} | Date: {new Date(ticket.createdAt).toLocaleDateString()}</p>
        </div>
        <Link href="/tickets" className="btn btn-outline btn-sm normal-case font-medium text-slate-600">
          ← Back to Tickets
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          <div className="card bg-white border border-slate-200 shadow-sm">
            <div className="card-body p-6">
              <h2 className="card-title text-lg border-b pb-2 text-slate-800">Description</h2>
              <p className="text-slate-700 whitespace-pre-wrap mt-2">{ticket.ticketDescription}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Comments</h3>
            
            {ticket.comments && ticket.comments.length > 0 ? (
              ticket.comments.map((comment) => (
                <div key={comment.id} className="card bg-slate-100 border border-slate-200 shadow-sm p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm text-slate-800">{comment.createdByName}</span>
                    <span className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">No comments yet.</p>
            )}

            <form onSubmit={handleAddComment} className="mt-4">
              <textarea
                className="textarea textarea-bordered w-full bg-white text-slate-900 focus:textarea-primary text-sm"
                placeholder="Write a comment..."
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
              ></textarea>
              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  disabled={submittingComment || !newComment.trim()} 
                  className="btn btn-primary btn-sm text-white"
                >
                  {submittingComment ? <span className="loading loading-spinner loading-xs"></span> : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-white border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 border-b pb-2">Ticket Details</h3>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Status</span>
              <span className="badge badge-info text-xs">{ticket.statusName}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Priority</span>
              <span className="badge badge-warning text-xs">{ticket.priorityName}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Category</span>
              <span className="text-sm text-slate-800 font-medium">{ticket.categoryName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}