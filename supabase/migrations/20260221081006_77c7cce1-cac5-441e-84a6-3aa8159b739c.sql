
-- Allow users to delete their own pending leave requests
CREATE POLICY "Users can delete own pending leaves"
ON public.leave_requests
FOR DELETE
USING (user_id = auth.uid() AND status = 'pending');

-- Allow admins to delete any leave request
CREATE POLICY "Admins can delete any leave"
ON public.leave_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
