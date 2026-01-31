-- Create user preferences table to persist accessibility settings
CREATE TABLE public.user_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    high_contrast BOOLEAN DEFAULT false,
    large_text BOOLEAN DEFAULT false,
    reduce_motion BOOLEAN DEFAULT false,
    speak_rate DECIMAL(3,2) DEFAULT 0.9,
    language VARCHAR(10) DEFAULT 'en-US',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction logs table to store payment history
CREATE TABLE public.transaction_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    upi_id VARCHAR(255),
    recipient_name VARCHAR(255),
    amount DECIMAL(12,2),
    transaction_type VARCHAR(50) DEFAULT 'payment',
    status VARCHAR(50) DEFAULT 'initiated',
    upi_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SMS explanation logs for debugging/analytics
CREATE TABLE public.sms_explanation_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    original_text TEXT NOT NULL,
    explanation TEXT,
    language VARCHAR(10) DEFAULT 'en-US',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_explanation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for transaction_logs
CREATE POLICY "Users can view their own transactions" 
ON public.transaction_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.transaction_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for sms_explanation_logs
CREATE POLICY "Users can view their own explanations" 
ON public.sms_explanation_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own explanations" 
ON public.sms_explanation_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous usage for the accessibility app (guest mode)
CREATE POLICY "Allow anonymous inserts for transactions" 
ON public.transaction_logs 
FOR INSERT 
WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow anonymous inserts for explanations" 
ON public.sms_explanation_logs 
FOR INSERT 
WITH CHECK (user_id IS NULL);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for user_preferences
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();