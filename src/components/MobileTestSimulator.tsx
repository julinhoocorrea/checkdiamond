import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  CheckCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink,
  Settings,
  User,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TestEnvio {
  id: string;
  kwaiId: string;
  diamondQuantity: number;
  customerName: string;
}

interface MobileStep {
  id: number;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  isManual: boolean;
  duration: number;
}

export function MobileTestSimulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [kwaiAppInstalled, setKwaiAppInstalled] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Envio de teste
  const testEnvio: TestEnvio = {
    id: 'test_001',
    kwaiId: 'teste123',
    diamondQuantity: 100,
    customerName: 'Cliente Teste'
  };

  const steps: MobileStep[] = [
    {
      id: 1,
      title: '📱 Verificando App Kwai',
      description: 'Verificando se o app Kwai nativo está instalado',
      action: 'checkApp',
      completed: false,
      isManual: false,
      duration: 2000
    },
    {
      id: 2,
      title: '💬 Abrindo Mensagens',
      description: 'Navegando para aba de mensagens no app nativo',
      action: 'openMessages',
      completed: false,
      isManual: false,
      duration: 1500
    },
    {
      id: 3,
      title: '🛍️ Procurando Kwai Shop',
      description: 'Abrindo conversa com Kwai Shop ou conta oficial',
      action: 'openShop',
      completed: false,
      isManual: false,
      duration: 1500
    },
    {
      id: 4,
      title: '🔗 Link de Distribuição',
      description: 'MANUAL: Você deve clicar no link dentro da conversa',
      action: 'clickLink',
      completed: false,
      isManual: true,
      duration: 5000
    },
    {
      id: 5,
      title: '📝 Preenchendo Formulário',
      description: `MANUAL: Preencha ID "${testEnvio.kwaiId}" e "${testEnvio.diamondQuantity}" diamantes`,
      action: 'fillForm',
      completed: false,
      isManual: true,
      duration: 8000
    },
    {
      id: 6,
      title: '✅ Confirmando Envio',
      description: 'MANUAL: Clique "Confirm" no app e confirme aqui',
      action: 'confirmSend',
      completed: false,
      isManual: true,
      duration: 10000
    }
  ];

  const [testSteps, setTestSteps] = useState(steps);

  // Simular verificação do app Kwai
  const checkKwaiApp = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Simular detecção de app
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (!isMobileDevice) {
        setKwaiAppInstalled(false);
        resolve(false);
        return;
      }

      // Simular tentativa de abrir app
      setTimeout(() => {
        const appInstalled = Math.random() > 0.3; // 70% chance de estar instalado
        setKwaiAppInstalled(appInstalled);
        resolve(appInstalled);
      }, 1500);
    });
  };

  // Executar step específico
  const executeStep = async (step: MobileStep) => {
    addTestResult(`🔄 Executando: ${step.title}`);

    switch (step.action) {
      case 'checkApp':
        const appInstalled = await checkKwaiApp();
        if (appInstalled) {
          addTestResult('✅ App Kwai encontrado e abrindo...');
          try {
            // Tentar abrir app via deep link
            window.location.href = 'kwai://main';
            addTestResult('📱 Deep link enviado: kwai://main');
          } catch (error) {
            addTestResult('⚠️ Deep link falhou, mas continuando...');
          }
        } else {
          addTestResult('❌ App Kwai não encontrado!');
          throw new Error('App Kwai não instalado');
        }
        break;

      case 'openMessages':
        addTestResult('💬 Navegando para mensagens...');
        try {
          window.location.href = 'kwai://open?page=messages';
          addTestResult('📱 Deep link enviado: kwai://open?page=messages');
        } catch (error) {
          addTestResult('⚠️ Navegação manual necessária');
        }
        break;

      case 'openShop':
        addTestResult('🛍️ Procurando Kwai Shop...');
        try {
          if (/Android/i.test(navigator.userAgent)) {
            window.location.href = 'kwai://chat?user=kwai_official';
            addTestResult('📱 Deep link Android: kwai://chat?user=kwai_official');
          } else {
            window.location.href = 'kwai://open?chat=kwai_shop';
            addTestResult('📱 Deep link iOS: kwai://open?chat=kwai_shop');
          }
        } catch (error) {
          addTestResult('⚠️ Abertura manual necessária');
        }
        break;

      case 'clickLink':
        addTestResult('🔗 AÇÃO MANUAL: Clique no link de distribuição dentro da conversa');
        toast.warning('🔗 AÇÃO MANUAL NECESSÁRIA', {
          description: 'Encontre e clique no link de distribuição de diamantes na conversa',
          duration: 8000
        });
        break;

      case 'fillForm':
        addTestResult('📝 AÇÃO MANUAL: Preencha o formulário no app');
        const dataText = `ID: ${testEnvio.kwaiId}\nDiamantes: ${testEnvio.diamondQuantity}`;

        try {
          await navigator.clipboard.writeText(dataText);
          addTestResult('📋 Dados copiados para clipboard!');
          toast.success('📋 Dados copiados!', {
            description: 'Cole no formulário do app Kwai'
          });
        } catch {
          addTestResult('📋 Copie manualmente: ' + dataText);
        }

        toast.warning('📝 PREENCHA NO APP KWAI:', {
          description: `ID: ${testEnvio.kwaiId} | Diamantes: ${testEnvio.diamondQuantity}`,
          duration: 15000
        });
        break;

      case 'confirmSend':
        addTestResult('✅ AÇÃO MANUAL: Confirme o envio no app');
        toast.warning('✅ CONFIRME NO APP KWAI', {
          description: 'Clique "Confirm" no app e confirme aqui quando terminar',
          duration: 20000
        });

        // Simular aguardo da confirmação
        setTimeout(() => {
          const confirmed = window.confirm(
            `Você confirmou o envio no app Kwai?\n\n` +
            `✅ SIM = Envio realizado com sucesso\n` +
            `❌ NÃO = Houve algum problema`
          );

          if (confirmed) {
            addTestResult('🎉 Envio confirmado pelo usuário!');
            toast.success('🎉 Envio confirmado!', {
              description: 'Processo concluído com sucesso'
            });
          } else {
            addTestResult('❌ Envio não confirmado');
            toast.error('❌ Envio não confirmado');
          }
        }, 3000);
        break;
    }
  };

  // Adicionar resultado do teste
  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Executar teste completo
  const startTest = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    setTestResults([]);

    // Reset steps
    setTestSteps(steps.map(s => ({ ...s, completed: false })));

    addTestResult('🚀 INICIANDO TESTE DO SISTEMA HÍBRIDO MOBILE');
    addTestResult(`📱 Dispositivo: ${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}`);

    try {
      for (let i = 0; i < testSteps.length; i++) {
        const step = testSteps[i];

        setCurrentStep(i);
        addTestResult(`\n--- STEP ${i + 1}: ${step.title} ---`);

        // Executar step
        await executeStep(step);

        // Marcar como completo
        setTestSteps(prev =>
          prev.map(s => s.id === step.id ? { ...s, completed: true } : s)
        );

        // Aguardar duração do step
        await new Promise(resolve => setTimeout(resolve, step.duration));

        addTestResult(`✅ Step ${i + 1} concluído`);
      }

      setCurrentStep(testSteps.length);
      addTestResult('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
      toast.success('🎉 Teste concluído!', {
        description: 'Sistema híbrido testado com sucesso'
      });

    } catch (error) {
      addTestResult(`\n❌ TESTE FALHOU: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast.error('❌ Teste falhou', {
        description: error instanceof Error ? error.message : 'Erro no teste'
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Reset teste
  const resetTest = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setTestResults([]);
    setTestSteps(steps.map(s => ({ ...s, completed: false })));
    setKwaiAppInstalled(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Smartphone className="w-6 h-6" />
            🎯 TESTE DIRETO - Sistema Híbrido Mobile
          </CardTitle>
          <CardDescription className="text-blue-700">
            Teste completo do sistema que abre o app Kwai nativo + ações manuais.
            {navigator.userAgent.includes('Mobile') ?
              ' 📱 Dispositivo mobile detectado!' :
              ' 🖥️ Teste em desktop (simulado)'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={startTest}
              disabled={isRunning}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  🚀 INICIAR TESTE
                </>
              )}
            </Button>

            <Button
              onClick={resetTest}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress do Teste */}
      {(isRunning || testResults.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Steps Visual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📋 Progresso do Teste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      step.completed
                        ? 'bg-green-50 border-green-200'
                        : index === currentStep && isRunning
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {step.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : index === currentStep && isRunning ? (
                        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{step.title}</span>
                        {step.isManual && (
                          <Badge variant="outline" className="text-xs">
                            👤 Manual
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">{step.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Log de Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📊 Log de Teste em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-80 overflow-y-auto">
                <AnimatePresence>
                  {testResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-1"
                    >
                      {result}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isRunning && (
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
                    className="text-yellow-400"
                  >
                    ▋ Executando...
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dados do Teste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📝 Dados do Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Cliente:</strong> {testEnvio.customerName}
            </div>
            <div>
              <strong>Kwai ID:</strong>
              <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{testEnvio.kwaiId}</code>
            </div>
            <div>
              <strong>Diamantes:</strong>
              <span className="ml-2 font-bold text-purple-600">{testEnvio.diamondQuantity}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-800">💡 Como Testar</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-700">
          <div className="space-y-2">
            <div><strong>1.</strong> Clique "🚀 INICIAR TESTE" acima</div>
            <div><strong>2.</strong> Acompanhe o progresso visual dos 6 steps</div>
            <div><strong>3.</strong> Steps 1-3 são automáticos (tentam abrir app)</div>
            <div><strong>4.</strong> Steps 4-6 são manuais (você executa no app)</div>
            <div><strong>5.</strong> Observe o log para ver o que acontece</div>
            <div><strong>6.</strong> Se estiver no celular, app Kwai pode abrir de verdade!</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
