-- Supabase function to handle credit transactions and bypass RLS
-- This function will be called from the client to securely add credit transactions

CREATE OR REPLACE FUNCTION add_credit_transaction(
  p_wallet_address TEXT,
  p_type TEXT,
  p_amount NUMERIC,
  p_description TEXT,
  p_transaction_reference TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
DECLARE
  result_data JSON;
  new_transaction credit_transactions;
BEGIN
  -- Validate input parameters
  IF p_wallet_address IS NULL OR p_wallet_address = '' THEN
    RETURN json_build_object('success', false, 'error', 'Wallet address is required');
  END IF;

  IF p_type NOT IN ('initial', 'usage', 'refund', 'bonus') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid transaction type');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Check if user profile exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE wallet_address = p_wallet_address) THEN
    RETURN json_build_object('success', false, 'error', 'User profile not found');
  END IF;

  -- Insert the credit transaction
  INSERT INTO credit_transactions (
    wallet_address,
    type,
    amount,
    description,
    transaction_reference
  ) VALUES (
    p_wallet_address,
    p_type,
    p_amount,
    p_description,
    p_transaction_reference
  ) RETURNING * INTO new_transaction;

  -- Update user credits balance if this is a credit addition
  IF p_type IN ('initial', 'bonus', 'refund') THEN
    UPDATE user_profiles 
    SET 
      credits_balance = credits_balance + p_amount,
      updated_at = NOW()
    WHERE wallet_address = p_wallet_address;
  ELSIF p_type = 'usage' THEN
    UPDATE user_profiles 
    SET 
      credits_balance = GREATEST(credits_balance - p_amount, 0),
      updated_at = NOW()
    WHERE wallet_address = p_wallet_address;
  END IF;

  -- Return success result
  result_data := json_build_object(
    'success', true,
    'data', row_to_json(new_transaction)
  );

  RETURN result_data;

EXCEPTION
  WHEN others THEN
    RETURN json_build_object(
      'success', false, 
      'error', SQLERRM
    );
END;
$$;
