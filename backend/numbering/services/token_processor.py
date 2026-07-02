from datetime import datetime

class TokenProcessor:
    @staticmethod
    def get_financial_year(date=None):
        if date is None:
            date = datetime.now()
        year = date.year
        month = date.month
        if month >= 4:
            return f"{year % 100}-{(year + 1) % 100:02d}"
        else:
            return f"{(year - 1) % 100}-{year % 100:02d}"
    
    @staticmethod
    def get_period_key(reset_policy, date=None):
        if date is None:
            date = datetime.now()
        policies = {
            'FY': lambda d: TokenProcessor.get_financial_year(d),
            'YEAR': lambda d: str(d.year),
            'MONTH': lambda d: f"{d.year}{d.month:02d}",
            'DAY': lambda d: f"{d.year}{d.month:02d}{d.day:02d}",
            'NEVER': lambda d: 'GLOBAL'
        }
        if reset_policy in policies:
            return policies[reset_policy](date)
        return 'GLOBAL'
    
    @staticmethod
    def process_token(token, context, sequence_value=None):
        token_id = token['token_id']
        token_value = token.get('token_value', '')
        seq_length = token.get('seq_length')
        now = datetime.now()
        
        handlers = {
            'PREFIX': lambda: token_value,
            'SUFFIX': lambda: token_value,
            'STATIC': lambda: token_value,
            'BRANCH': lambda: context.get('branch', ''),
            'PRODUCT': lambda: context.get('product', ''),
            'YYYY': lambda: str(now.year),
            'YY': lambda: str(now.year)[-2:],
            'MM': lambda: f"{now.month:02d}",
            'DD': lambda: f"{now.day:02d}",
            'FY': lambda: TokenProcessor.get_financial_year(),
            'SEQ': lambda: str(sequence_value).zfill(seq_length) if sequence_value else ''
        }
        return handlers.get(token_id, lambda: '')()

    @staticmethod
    def validate_pattern_tokens(tokens):
        has_seq = any(t['token_id'] == 'SEQ' for t in tokens)
        seq_count = sum(1 for t in tokens if t['token_id'] == 'SEQ')
        if not has_seq:
            raise ValueError("Pattern must contain at least one SEQ token")
        if seq_count > 1:
            raise ValueError("Pattern cannot have more than one SEQ token")
        return True