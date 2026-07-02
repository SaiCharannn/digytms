from rest_framework import serializers
from .models import NumPatMast, NumPatDetails, NumPatSeq, NumGenLog


class BooleanFieldSerializer(serializers.BooleanField):
    def to_internal_value(self, data):
        if isinstance(data, str):
            if data.lower() == 'true':
                return True
            elif data.lower() == 'false':
                return False
        return super().to_internal_value(data)


class NumPatMastSerializer(serializers.ModelSerializer):
    class Meta:
        model = NumPatMast
        fields = '__all__'
        read_only_fields = ['created_datetime', 'modified_datetime']
    
    def validate(self, data):
        if data.get('seq_start', 0) >= data.get('seq_end', 0):
            raise serializers.ValidationError({"seq_end": "Start number must be less than end number"})
        if data.get('seq_step', 1) <= 0:
            raise serializers.ValidationError({"seq_step": "Step must be positive"})
        return data
    
    def validate_num_pat_id(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Pattern ID is required")
        return value.upper()
    
    def validate_pattern_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Pattern name is required")
        return value.strip()


class NumPatDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NumPatDetails
        fields = '__all__'
        read_only_fields = ['created_datetime', 'modified_datetime']
    
    def validate(self, data):
        token_id = data.get('token_id')
        
        if token_id == 'SEQ':
            if not data.get('seq_length'):
                raise serializers.ValidationError({"seq_length": "SEQ token requires seq_length"})
            if not data.get('reset_policy'):
                raise serializers.ValidationError({"reset_policy": "SEQ token requires reset_policy"})
        
        if token_id in ['PREFIX', 'SUFFIX', 'STATIC']:
            if not data.get('token_value'):
                raise serializers.ValidationError({"token_value": f"{token_id} token requires token_value"})
        
        return data


class NumPatSeqSerializer(serializers.ModelSerializer):
    class Meta:
        model = NumPatSeq
        fields = '__all__'


class NumGenLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NumGenLog
        fields = '__all__'
        read_only_fields = ['generated_datetime']


class NumPatMastCreateSerializer(serializers.Serializer):
    institution_id = serializers.CharField(max_length=20)
    num_pat_id = serializers.CharField(max_length=30)
    pattern_name = serializers.CharField(max_length=100)
    remarks = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    seq_start = serializers.IntegerField()
    seq_end = serializers.IntegerField()
    seq_step = serializers.IntegerField(default=1)
    status = serializers.ChoiceField(choices=NumPatMast.STATUS_CHOICES, default='ACTIVE')
    created_by = serializers.CharField(required=False, allow_null=True)


class NumPatDetailsCreateSerializer(serializers.Serializer):
    institution_id = serializers.CharField(max_length=20)
    num_pat_id = serializers.CharField(max_length=30)
    token_order = serializers.IntegerField()
    token_id = serializers.ChoiceField(choices=NumPatDetails.TOKEN_CHOICES)
    token_value = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    seq_length = serializers.IntegerField(required=False, allow_null=True)
    reset_policy = serializers.ChoiceField(choices=NumPatDetails.RESET_POLICY_CHOICES, required=False, allow_null=True)
    num_pat_status = serializers.CharField(default='ACTIVE')
    created_by = serializers.CharField(required=False, allow_null=True)


class GenerateNumberRequestSerializer(serializers.Serializer):
    institution_id = serializers.CharField(max_length=50)
    pattern_id = serializers.CharField(max_length=30)
    context = serializers.DictField(required=False, default=dict)


class PatternWithDetailsSerializer(serializers.Serializer):
    master = NumPatMastSerializer()
    details = NumPatDetailsSerializer(many=True)