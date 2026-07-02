from django.db import models
from django.core.exceptions import ValidationError

class NumPatMast(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('DELETED', 'Deleted'),
    ]
    
    institution_id = models.CharField(max_length=20, db_index=True)
    num_pat_id = models.CharField(max_length=30, primary_key=True)
    pattern_name = models.CharField(max_length=100)
    remarks = models.CharField(max_length=255, blank=True, null=True)
    seq_start = models.BigIntegerField()
    seq_end = models.BigIntegerField()
    seq_step = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_by = models.CharField(max_length=50, null=True, blank=True)
    created_datetime = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=50, null=True, blank=True)
    modified_datetime = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'num_pat_mast'
        indexes = [
            models.Index(fields=['institution_id', 'status']),
        ]
    
    def clean(self):
        if self.seq_start >= self.seq_end:
            raise ValidationError('Start number must be less than end number')
        if self.seq_step <= 0:
            raise ValidationError('Step must be positive')
    
    def __str__(self):
        return f"{self.num_pat_id} - {self.pattern_name}"


class NumPatDetails(models.Model):
    RESET_POLICY_CHOICES = [
        ('FY', 'Financial Year'),
        ('YEAR', 'Year'),
        ('MONTH', 'Month'),
        ('NEVER', 'Never'),
    ]
    
    TOKEN_CHOICES = [
        ('PREFIX', 'Prefix'),
        ('SUFFIX', 'Suffix'),
        ('SEQ', 'Sequence'),
        ('YYYY', 'Year (4-digit)'),
        ('YY', 'Year (2-digit)'),
        ('MM', 'Month'),
        ('DD', 'Day'),
        ('FY', 'Financial Year'),
        ('STATIC', 'Static Text'),
        ('BRANCH', 'Branch'),
        ('PRODUCT', 'Product'),
    ]
    
    id = models.AutoField(primary_key=True)
    institution_id = models.CharField(max_length=20, db_index=True)
    num_pat_id = models.CharField(max_length=30, db_index=True)
    token_order = models.IntegerField()
    token_id = models.CharField(max_length=20, choices=TOKEN_CHOICES)
    token_value = models.CharField(max_length=100, blank=True, null=True)
    seq_length = models.IntegerField(null=True, blank=True)
    reset_policy = models.CharField(max_length=20, choices=RESET_POLICY_CHOICES, null=True, blank=True)
    num_pat_status = models.CharField(max_length=20, default='ACTIVE')
    created_by = models.CharField(max_length=50, null=True, blank=True)
    created_datetime = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=50, null=True, blank=True)
    modified_datetime = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'num_pat_details'
        ordering = ['token_order']
        unique_together = [['num_pat_id', 'token_order']]
        indexes = [
            models.Index(fields=['num_pat_id', 'token_order']),
            models.Index(fields=['institution_id', 'num_pat_id']),
        ]
    
    def clean(self):
        if self.token_id == 'SEQ' and not self.seq_length:
            raise ValidationError('SEQ token requires seq_length')
        if self.token_id == 'SEQ' and not self.reset_policy:
            raise ValidationError('SEQ token requires reset_policy')
    
    def __str__(self):
        return f"{self.num_pat_id} - Order {self.token_order}: {self.token_id}"


class NumPatSeq(models.Model):
    institution_id = models.CharField(max_length=20)
    num_pat_id = models.CharField(max_length=30)
    period_key = models.CharField(max_length=20)
    last_number = models.BigIntegerField(default=0)
    
    class Meta:
        db_table = 'num_pat_seq'
        unique_together = [['institution_id', 'num_pat_id', 'period_key']]
        indexes = [
            models.Index(fields=['institution_id', 'num_pat_id', 'period_key']),
        ]
    
    def __str__(self):
        return f"{self.num_pat_id} - {self.period_key}: {self.last_number}"


class NumGenLog(models.Model):
    institution_id = models.CharField(max_length=20)
    num_pat_id = models.CharField(max_length=30)
    generated_number = models.CharField(max_length=200)
    period_key = models.CharField(max_length=20)
    context_data = models.JSONField(default=dict)
    generated_by = models.CharField(max_length=50, null=True)
    generated_datetime = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'num_gen_log'
        indexes = [
            models.Index(fields=['institution_id', 'num_pat_id', 'generated_datetime']),
        ]